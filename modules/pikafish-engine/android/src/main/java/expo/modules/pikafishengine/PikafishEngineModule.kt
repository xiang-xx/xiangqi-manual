package expo.modules.pikafishengine

import android.content.Context
import android.system.Os
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class PikafishEngineModule : Module() {
  private var process: Process? = null
  private var writer: OutputStreamWriter? = null
  private val running = AtomicBoolean(false)
  private val executor = Executors.newSingleThreadExecutor()
  private val writeExecutor = Executors.newSingleThreadExecutor()

  override fun definition() = ModuleDefinition {
    Name("PikafishEngine")

    Events("onLine", "onExit", "onError")

    AsyncFunction("start") { promise: Promise ->
      executor.execute {
        try {
          if (running.get()) {
            promise.resolve(true)
            return@execute
          }
          val ctx = appContext.reactContext
            ?: throw IllegalStateException("No React context")
          val nnuePath = ensureNnue(ctx)
          val binary = resolveBinary(ctx)
          val workDir = binary.parentFile ?: ctx.codeCacheDir
          val pb = ProcessBuilder(binary.absolutePath)
            .directory(workDir)
            .redirectErrorStream(true)
          val env = pb.environment()
          env["LD_LIBRARY_PATH"] = workDir.absolutePath
          val proc =
            try {
              pb.start()
            } catch (e: Exception) {
              throw IllegalStateException(
                "cannot run ${binary.absolutePath} (exists=${binary.exists()} exec=${binary.canExecute()} size=${binary.length()}): ${e.message}",
                e,
              )
            }
          process = proc
          writer = OutputStreamWriter(proc.outputStream, Charsets.UTF_8)
          running.set(true)

          Thread {
            try {
              val reader = BufferedReader(InputStreamReader(proc.inputStream, Charsets.UTF_8))
              var line: String?
              while (reader.readLine().also { line = it } != null) {
                sendEvent("onLine", mapOf("line" to (line ?: "")))
              }
            } catch (e: Exception) {
              sendEvent("onError", mapOf("message" to (e.message ?: "read failed")))
            } finally {
              running.set(false)
              sendEvent("onExit", mapOf("code" to try { proc.exitValue() } catch (_: Exception) { -1 }))
            }
          }.start()

          sendCommandSync("uci")
          sendCommandSync("setoption name EvalFile value $nnuePath")
          sendCommandSync("setoption name Threads value 1")
          sendCommandSync("isready")
          promise.resolve(true)
        } catch (e: Exception) {
          running.set(false)
          promise.reject("PIKAFISH_START", e.message, e)
        }
      }
    }

    AsyncFunction("send") { command: String, promise: Promise ->
      writeExecutor.execute {
        try {
          sendCommandSync(command)
          promise.resolve(true)
        } catch (e: Exception) {
          promise.reject("PIKAFISH_SEND", e.message, e)
        }
      }
    }

    AsyncFunction("stop") { promise: Promise ->
      executor.execute {
        try {
          stopEngine()
          promise.resolve(true)
        } catch (e: Exception) {
          promise.reject("PIKAFISH_STOP", e.message, e)
        }
      }
    }

    OnDestroy {
      stopEngine()
    }
  }

  private fun sendCommandSync(command: String) {
    val w = writer ?: throw IllegalStateException("Engine not started")
    synchronized(w) {
      w.write(command.trimEnd() + "\n")
      w.flush()
    }
  }

  private fun stopEngine() {
    try {
      if (running.get()) {
        try {
          sendCommandSync("quit")
        } catch (_: Exception) {
        }
      }
      process?.destroy()
    } catch (_: Exception) {
    } finally {
      process = null
      writer = null
      running.set(false)
    }
  }

  /**
   * Prefer nativeLibraryDir (executable after useLegacyPackaging=true).
   * filesDir is often noexec on MIUI — do not run from there.
   */
  private fun resolveBinary(ctx: Context): File {
    val nativeSo = File(ctx.applicationInfo.nativeLibraryDir, "libpikafish.so")
    if (nativeSo.exists() && nativeSo.length() > 100_000L) {
      return nativeSo
    }

    // Fallback: extract asset into codeCacheDir and chmod 0700
    val dest = File(ctx.codeCacheDir, "pikafish")
    val needCopy = !dest.exists() || dest.length() < 100_000L
    if (needCopy) {
      ctx.assets.open("pikafish").use { input ->
        FileOutputStream(dest).use { output -> input.copyTo(output) }
      }
    }
    try {
      Os.chmod(dest.absolutePath, 448) // 0700
    } catch (_: Exception) {
      dest.setReadable(true, true)
      dest.setExecutable(true, true)
    }
    if (!dest.exists()) {
      throw IllegalStateException("pikafish missing after extract")
    }
    return dest
  }

  private fun ensureNnue(ctx: Context): String {
    val out = File(ctx.filesDir, "pikafish.nnue")
    if (out.exists() && out.length() > 1_000_000L) {
      return out.absolutePath
    }
    ctx.assets.open("pikafish.nnue").use { input ->
      FileOutputStream(out).use { output ->
        input.copyTo(output)
      }
    }
    return out.absolutePath
  }
}
