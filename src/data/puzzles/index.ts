import type { Puzzle } from '../../types/puzzle';
import { sortPuzzleTags } from '../puzzleTags';

import cg003 from './cg-003.json';
import cg007 from './cg-007.json';
import cg009 from './cg-009.json';
import cg010 from './cg-010.json';
import cg011 from './cg-011.json';
import cg012 from './cg-012.json';
import cg013 from './cg-013.json';
import cg014 from './cg-014.json';
import cg015 from './cg-015.json';
import cg016 from './cg-016.json';
import cg019 from './cg-019.json';
import cg020 from './cg-020.json';
import cg021 from './cg-021.json';
import cg022 from './cg-022.json';
import cg023 from './cg-023.json';
import cg024 from './cg-024.json';
import cg025 from './cg-025.json';
import cg026 from './cg-026.json';
import cg027 from './cg-027.json';
import cg028 from './cg-028.json';
import cg029 from './cg-029.json';
import cg030 from './cg-030.json';
import cg031 from './cg-031.json';
import cg033 from './cg-033.json';
import cg035 from './cg-035.json';
import cg037 from './cg-037.json';
import cg038 from './cg-038.json';
import cg039 from './cg-039.json';
import cg040 from './cg-040.json';
import cg042 from './cg-042.json';
import cg044 from './cg-044.json';
import cg046 from './cg-046.json';
import cg047 from './cg-047.json';
import cg049 from './cg-049.json';
import cg050 from './cg-050.json';
import cg051 from './cg-051.json';
import cg052 from './cg-052.json';
import cg053 from './cg-053.json';
import cg054 from './cg-054.json';
import cg055 from './cg-055.json';
import cg056 from './cg-056.json';
import cg057 from './cg-057.json';
import cg058 from './cg-058.json';
import cg059 from './cg-059.json';
import cg060 from './cg-060.json';
import cg061 from './cg-061.json';
import cg062 from './cg-062.json';
import cg063 from './cg-063.json';
import cg064 from './cg-064.json';
import cg065 from './cg-065.json';
import cg066 from './cg-066.json';
import cg067 from './cg-067.json';
import cg068 from './cg-068.json';
import cg069 from './cg-069.json';
import cg070 from './cg-070.json';
import cg071 from './cg-071.json';
import cg072 from './cg-072.json';
import cg073 from './cg-073.json';
import cg074 from './cg-074.json';
import cg075 from './cg-075.json';
import cg076 from './cg-076.json';
import cg077 from './cg-077.json';
import cg078 from './cg-078.json';
import cg080 from './cg-080.json';
import cg081 from './cg-081.json';
import cg082 from './cg-082.json';
import cg083 from './cg-083.json';
import cg084 from './cg-084.json';
import cg085 from './cg-085.json';
import cg086 from './cg-086.json';
import cg087 from './cg-087.json';
import cg089 from './cg-089.json';
import cg090 from './cg-090.json';
import cg091 from './cg-091.json';
import cg092 from './cg-092.json';
import cg093 from './cg-093.json';
import cg094 from './cg-094.json';
import cg095 from './cg-095.json';
import cg096 from './cg-096.json';
import cg097 from './cg-097.json';
import cg098 from './cg-098.json';
import cg099 from './cg-099.json';
import cg100 from './cg-100.json';
import cg101 from './cg-101.json';
import cg103 from './cg-103.json';
import cg104 from './cg-104.json';
import cg105 from './cg-105.json';
import cg106 from './cg-106.json';
import cg107 from './cg-107.json';
import cg109 from './cg-109.json';
import cg110 from './cg-110.json';
import cg111 from './cg-111.json';
import cg112 from './cg-112.json';
import cg113 from './cg-113.json';
import cg114 from './cg-114.json';
import cg115 from './cg-115.json';
import cg116 from './cg-116.json';
import cg117 from './cg-117.json';
import cg118 from './cg-118.json';
import cg119 from './cg-119.json';
import cg120 from './cg-120.json';
import cg121 from './cg-121.json';
import cg122 from './cg-122.json';
import cg123 from './cg-123.json';
import cg124 from './cg-124.json';
import cg125 from './cg-125.json';
import cg126 from './cg-126.json';
import cg127 from './cg-127.json';
import cg128 from './cg-128.json';
import cg129 from './cg-129.json';
import cg130 from './cg-130.json';
import cg131 from './cg-131.json';
import cg132 from './cg-132.json';
import cg133 from './cg-133.json';
import cg134 from './cg-134.json';
import cg136 from './cg-136.json';
import cg137 from './cg-137.json';
import cg138 from './cg-138.json';
import cg139 from './cg-139.json';
import cg140 from './cg-140.json';
import cg141 from './cg-141.json';
import cg142 from './cg-142.json';
import cg144 from './cg-144.json';
import cg146 from './cg-146.json';
import cg147 from './cg-147.json';
import cg148 from './cg-148.json';
import cg150 from './cg-150.json';
import cg151 from './cg-151.json';
import cg152 from './cg-152.json';
import cg153 from './cg-153.json';
import cg154 from './cg-154.json';
import cg155 from './cg-155.json';
import cg156 from './cg-156.json';
import cg157 from './cg-157.json';
import cg158 from './cg-158.json';
import cg159 from './cg-159.json';
import cg160 from './cg-160.json';
import cg161 from './cg-161.json';
import cg162 from './cg-162.json';
import cg163 from './cg-163.json';
import cg164 from './cg-164.json';
import cg165 from './cg-165.json';
import cg166 from './cg-166.json';
import cg167 from './cg-167.json';
import cg168 from './cg-168.json';
import cg170 from './cg-170.json';
import cg173 from './cg-173.json';
import cg174 from './cg-174.json';
import cg175 from './cg-175.json';
import cg177 from './cg-177.json';
import cg178 from './cg-178.json';
import cg179 from './cg-179.json';
import cg180 from './cg-180.json';
import cg182 from './cg-182.json';
import cg183 from './cg-183.json';
import cg185 from './cg-185.json';
import cg186 from './cg-186.json';
import cg187 from './cg-187.json';
import cg188 from './cg-188.json';
import cg189 from './cg-189.json';
import cg190 from './cg-190.json';
import cg191 from './cg-191.json';
import cg192 from './cg-192.json';
import cg194 from './cg-194.json';
import cg195 from './cg-195.json';
import cg196 from './cg-196.json';
import cg197 from './cg-197.json';
import cg199 from './cg-199.json';
import cg200 from './cg-200.json';
import cg201 from './cg-201.json';
import cg203 from './cg-203.json';
import cg204 from './cg-204.json';
import cg205 from './cg-205.json';
import cg206 from './cg-206.json';
import cg207 from './cg-207.json';
import cg208 from './cg-208.json';
import cg209 from './cg-209.json';
import cg210 from './cg-210.json';
import cg211 from './cg-211.json';
import cg212 from './cg-212.json';
import cg215 from './cg-215.json';
import cg216 from './cg-216.json';
import cg217 from './cg-217.json';
import cg218 from './cg-218.json';
import cg219 from './cg-219.json';
import cg220 from './cg-220.json';
import cg221 from './cg-221.json';
import cg222 from './cg-222.json';
import cg224 from './cg-224.json';
import cg225 from './cg-225.json';
import cg226 from './cg-226.json';
import cg229 from './cg-229.json';
import cg231 from './cg-231.json';
import cg232 from './cg-232.json';
import cg233 from './cg-233.json';
import cg235 from './cg-235.json';
import cg236 from './cg-236.json';
import cg237 from './cg-237.json';
import cg238 from './cg-238.json';
import cg239 from './cg-239.json';
import cg240 from './cg-240.json';
import cg241 from './cg-241.json';
import cg242 from './cg-242.json';
import cg243 from './cg-243.json';
import cg244 from './cg-244.json';
import cg245 from './cg-245.json';
import cg246 from './cg-246.json';
import cg248 from './cg-248.json';
import cg249 from './cg-249.json';
import cg250 from './cg-250.json';
import cg251 from './cg-251.json';
import cg252 from './cg-252.json';
import cg253 from './cg-253.json';
import cg254 from './cg-254.json';
import cg255 from './cg-255.json';
import cg256 from './cg-256.json';
import cg258 from './cg-258.json';
import cg259 from './cg-259.json';
import cg261 from './cg-261.json';
import cg262 from './cg-262.json';
import cg263 from './cg-263.json';
import cg264 from './cg-264.json';
import cg265 from './cg-265.json';
import cg266 from './cg-266.json';
import cg270 from './cg-270.json';
import cg271 from './cg-271.json';
import cg274 from './cg-274.json';
import cg275 from './cg-275.json';
import cg276 from './cg-276.json';
import cg277 from './cg-277.json';
import cg278 from './cg-278.json';
import cg279 from './cg-279.json';
import cg280 from './cg-280.json';
import cg281 from './cg-281.json';
import cg282 from './cg-282.json';
import cg283 from './cg-283.json';
import cg284 from './cg-284.json';
import cg285 from './cg-285.json';
import cg286 from './cg-286.json';
import cg288 from './cg-288.json';
import cg289 from './cg-289.json';
import cg290 from './cg-290.json';
import cg291 from './cg-291.json';
import cg292 from './cg-292.json';
import cg293 from './cg-293.json';
import cg294 from './cg-294.json';
import cg295 from './cg-295.json';
import cg296 from './cg-296.json';
import cg297 from './cg-297.json';
import cg298 from './cg-298.json';
import cg299 from './cg-299.json';
import cg300 from './cg-300.json';
import cg301 from './cg-301.json';
import cg302 from './cg-302.json';
import cg303 from './cg-303.json';
import cg304 from './cg-304.json';
import cg305 from './cg-305.json';
import cg306 from './cg-306.json';
import cg307 from './cg-307.json';
import cg308 from './cg-308.json';
import cg309 from './cg-309.json';
import cg310 from './cg-310.json';
import cg311 from './cg-311.json';
import cg312 from './cg-312.json';
import cg313 from './cg-313.json';
import cg316 from './cg-316.json';
import cg317 from './cg-317.json';
import cg318 from './cg-318.json';
import cg319 from './cg-319.json';
import cg320 from './cg-320.json';
import cg321 from './cg-321.json';
import cg323 from './cg-323.json';
import cg325 from './cg-325.json';
import cg328 from './cg-328.json';
import cg329 from './cg-329.json';
import cg330 from './cg-330.json';
import cg331 from './cg-331.json';
import cg332 from './cg-332.json';
import cg333 from './cg-333.json';
import cg334 from './cg-334.json';
import cg335 from './cg-335.json';
import cg336 from './cg-336.json';
import cg338 from './cg-338.json';
import cg339 from './cg-339.json';
import cg341 from './cg-341.json';
import cg342 from './cg-342.json';
import cg344 from './cg-344.json';
import cg345 from './cg-345.json';
import cg346 from './cg-346.json';
import cg347 from './cg-347.json';
import cg348 from './cg-348.json';
import cg349 from './cg-349.json';
import cg351 from './cg-351.json';
import cg352 from './cg-352.json';
import cg353 from './cg-353.json';
import cg354 from './cg-354.json';
import cg355 from './cg-355.json';
import cg356 from './cg-356.json';
import cg357 from './cg-357.json';
import cg358 from './cg-358.json';
import cg359 from './cg-359.json';
import cg360 from './cg-360.json';
import sqy001 from './sqy-001.json';
import sqy003 from './sqy-003.json';
import sqy004 from './sqy-004.json';
import sqy005 from './sqy-005.json';
import sqy007 from './sqy-007.json';
import sqy008 from './sqy-008.json';
import sqy012 from './sqy-012.json';
import sqy013 from './sqy-013.json';
import sqy014 from './sqy-014.json';
import sqy015 from './sqy-015.json';
import sqy016 from './sqy-016.json';
import sqy019 from './sqy-019.json';
import sqy020 from './sqy-020.json';
import sqy021 from './sqy-021.json';
import sqy022 from './sqy-022.json';
import sqy024 from './sqy-024.json';
import sqy028 from './sqy-028.json';
import sqy029 from './sqy-029.json';
import sqy031 from './sqy-031.json';
import sqy032 from './sqy-032.json';
import sqy033 from './sqy-033.json';
import sqy034 from './sqy-034.json';
import sqy035 from './sqy-035.json';
import sqy036 from './sqy-036.json';
import sqy037 from './sqy-037.json';
import sqy038 from './sqy-038.json';
import sqy040 from './sqy-040.json';
import sqy041 from './sqy-041.json';
import sqy042 from './sqy-042.json';
import sqy043 from './sqy-043.json';
import sqy044 from './sqy-044.json';
import sqy046 from './sqy-046.json';
import sqy049 from './sqy-049.json';
import sqy053 from './sqy-053.json';
import sqy054 from './sqy-054.json';
import sqy055 from './sqy-055.json';
import sqy057 from './sqy-057.json';
import sqy058 from './sqy-058.json';
import sqy060 from './sqy-060.json';
import sqy061 from './sqy-061.json';
import sqy062 from './sqy-062.json';
import sqy063 from './sqy-063.json';
import sqy070 from './sqy-070.json';
import sqy072 from './sqy-072.json';
import sqy075 from './sqy-075.json';
import sqy076 from './sqy-076.json';
import sqy078 from './sqy-078.json';
import sqy081 from './sqy-081.json';
import sqy082 from './sqy-082.json';
import sqy083 from './sqy-083.json';
import sqy084 from './sqy-084.json';
import sqy085 from './sqy-085.json';
import sqy086 from './sqy-086.json';
import sqy087 from './sqy-087.json';
import sqy088 from './sqy-088.json';
import sqy089 from './sqy-089.json';
import sqy090 from './sqy-090.json';
import sqy092 from './sqy-092.json';
import sqy093 from './sqy-093.json';
import sqy095 from './sqy-095.json';
import sqy096 from './sqy-096.json';
import sqy097 from './sqy-097.json';
import sqy098 from './sqy-098.json';
import sqy099 from './sqy-099.json';
import sqy100 from './sqy-100.json';
import sqy101 from './sqy-101.json';
import sqy104 from './sqy-104.json';
import sqy105 from './sqy-105.json';
import sqy106 from './sqy-106.json';
import sqy108 from './sqy-108.json';
import sqy110 from './sqy-110.json';
import sqy111 from './sqy-111.json';
import sqy112 from './sqy-112.json';
import sqy116 from './sqy-116.json';
import sqy118 from './sqy-118.json';
import sqy119 from './sqy-119.json';
import sqy120 from './sqy-120.json';
import sqy122 from './sqy-122.json';
import sqy124 from './sqy-124.json';
import sqy125 from './sqy-125.json';
import sqy128 from './sqy-128.json';
import sqy129 from './sqy-129.json';
import sqy131 from './sqy-131.json';
import sqy132 from './sqy-132.json';
import sqy135 from './sqy-135.json';
import sqy136 from './sqy-136.json';
import sqy137 from './sqy-137.json';
import sqy138 from './sqy-138.json';
import sqy139 from './sqy-139.json';
import sqy140 from './sqy-140.json';
import sqy141 from './sqy-141.json';
import sqy142 from './sqy-142.json';
import sqy143 from './sqy-143.json';
import sqy144 from './sqy-144.json';
import sqy145 from './sqy-145.json';
import sqy146 from './sqy-146.json';
import sqy149 from './sqy-149.json';
import sqy150 from './sqy-150.json';
import sqy151 from './sqy-151.json';
import sqy152 from './sqy-152.json';
import sqy153 from './sqy-153.json';
import sqy154 from './sqy-154.json';
import sqy156 from './sqy-156.json';
import sqy157 from './sqy-157.json';
import sqy159 from './sqy-159.json';
import sqy160 from './sqy-160.json';
import sqy161 from './sqy-161.json';
import sqy162 from './sqy-162.json';
import sqy163 from './sqy-163.json';
import sqy164 from './sqy-164.json';
import sqy166 from './sqy-166.json';
import sqy167 from './sqy-167.json';
import sqy168 from './sqy-168.json';
import sqy169 from './sqy-169.json';
import sqy170 from './sqy-170.json';
import sqy171 from './sqy-171.json';
import sqy172 from './sqy-172.json';
import sqy175 from './sqy-175.json';
import sqy176 from './sqy-176.json';
import sqy177 from './sqy-177.json';
import sqy178 from './sqy-178.json';
import sqy179 from './sqy-179.json';
import sqy180 from './sqy-180.json';
import sqy181 from './sqy-181.json';
import sqy184 from './sqy-184.json';
import sqy185 from './sqy-185.json';
import sqy187 from './sqy-187.json';
import sqy188 from './sqy-188.json';
import sqy189 from './sqy-189.json';
import sqy191 from './sqy-191.json';
import sqy193 from './sqy-193.json';
import sqy194 from './sqy-194.json';
import sqy195 from './sqy-195.json';
import sqy197 from './sqy-197.json';
import sqy198 from './sqy-198.json';
import sqy199 from './sqy-199.json';
import sqy200 from './sqy-200.json';
import sqy201 from './sqy-201.json';
import sqy202 from './sqy-202.json';
import sqy204 from './sqy-204.json';
import sqy205 from './sqy-205.json';
import sqy209 from './sqy-209.json';
import sqy210 from './sqy-210.json';
import sqy211 from './sqy-211.json';
import sqy212 from './sqy-212.json';
import sqy215 from './sqy-215.json';
import sqy216 from './sqy-216.json';
import sqy218 from './sqy-218.json';
import sqy219 from './sqy-219.json';
import sqy220 from './sqy-220.json';
import sqy221 from './sqy-221.json';
import sqy222 from './sqy-222.json';
import sqy223 from './sqy-223.json';
import sqy224 from './sqy-224.json';
import sqy225 from './sqy-225.json';
import sqy227 from './sqy-227.json';
import sqy228 from './sqy-228.json';
import sqy229 from './sqy-229.json';
import sqy230 from './sqy-230.json';
import sqy231 from './sqy-231.json';
import sqy232 from './sqy-232.json';
import sqy233 from './sqy-233.json';
import sqy235 from './sqy-235.json';
import sqy237 from './sqy-237.json';
import sqy238 from './sqy-238.json';
import sqy239 from './sqy-239.json';
import sqy240 from './sqy-240.json';
import sqy243 from './sqy-243.json';
import sqy245 from './sqy-245.json';
import sqy246 from './sqy-246.json';
import sqy248 from './sqy-248.json';
import sqy250 from './sqy-250.json';
import sqy251 from './sqy-251.json';
import sqy252 from './sqy-252.json';
import sqy254 from './sqy-254.json';
import sqy255 from './sqy-255.json';
import sqy256 from './sqy-256.json';
import sqy257 from './sqy-257.json';
import sqy258 from './sqy-258.json';
import sqy259 from './sqy-259.json';
import sqy260 from './sqy-260.json';
import sqy263 from './sqy-263.json';
import sqy264 from './sqy-264.json';
import sqy266 from './sqy-266.json';
import sqy267 from './sqy-267.json';
import sqy268 from './sqy-268.json';
import sqy270 from './sqy-270.json';
import sqy271 from './sqy-271.json';
import sqy272 from './sqy-272.json';
import sqy273 from './sqy-273.json';
import sqy274 from './sqy-274.json';
import sqy275 from './sqy-275.json';
import sqy277 from './sqy-277.json';
import sqy278 from './sqy-278.json';
import sqy280 from './sqy-280.json';
import sqy282 from './sqy-282.json';
import sqy283 from './sqy-283.json';
import sqy284 from './sqy-284.json';
import sqy285 from './sqy-285.json';
import sqy287 from './sqy-287.json';
import sqy289 from './sqy-289.json';
import sqy290 from './sqy-290.json';
import sqy291 from './sqy-291.json';
import sqy294 from './sqy-294.json';
import sqy295 from './sqy-295.json';
import sqy299 from './sqy-299.json';
import sqy300 from './sqy-300.json';
import sqy301 from './sqy-301.json';
import sqy303 from './sqy-303.json';
import sqy304 from './sqy-304.json';
import sqy307 from './sqy-307.json';
import sqy308 from './sqy-308.json';
import sqy311 from './sqy-311.json';
import sqy312 from './sqy-312.json';
import sqy316 from './sqy-316.json';
import sqy319 from './sqy-319.json';
import sqy321 from './sqy-321.json';
import sqy323 from './sqy-323.json';
import sqy324 from './sqy-324.json';
import sqy327 from './sqy-327.json';
import sqy328 from './sqy-328.json';
import sqy329 from './sqy-329.json';
import sqy332 from './sqy-332.json';
import sqy333 from './sqy-333.json';
import sqy335 from './sqy-335.json';
import sqy338 from './sqy-338.json';
import sqy339 from './sqy-339.json';
import sqy341 from './sqy-341.json';
import sqy345 from './sqy-345.json';
import sqy349 from './sqy-349.json';
import sqy350 from './sqy-350.json';
import sqy351 from './sqy-351.json';
import sqy352 from './sqy-352.json';
import sqy353 from './sqy-353.json';
import sqy354 from './sqy-354.json';
import sqy355 from './sqy-355.json';
import sqy356 from './sqy-356.json';
import sqy357 from './sqy-357.json';
import sqy358 from './sqy-358.json';
import sqy361 from './sqy-361.json';
import sqy362 from './sqy-362.json';
import sqy363 from './sqy-363.json';
import sqy364 from './sqy-364.json';
import sqy366 from './sqy-366.json';
import sqy367 from './sqy-367.json';
import sqy368 from './sqy-368.json';
import sqy369 from './sqy-369.json';
import sqy370 from './sqy-370.json';
import sqy371 from './sqy-371.json';
import sqy372 from './sqy-372.json';
import sqy375 from './sqy-375.json';
import sqy376 from './sqy-376.json';
import sqy379 from './sqy-379.json';
import sqy380 from './sqy-380.json';
import sqy383 from './sqy-383.json';
import sqy384 from './sqy-384.json';
import sqy386 from './sqy-386.json';
import sqy387 from './sqy-387.json';
import sqy389 from './sqy-389.json';
import sqy390 from './sqy-390.json';
import sqy392 from './sqy-392.json';
import sqy394 from './sqy-394.json';
import sqy395 from './sqy-395.json';
import sqy396 from './sqy-396.json';
import sqy397 from './sqy-397.json';
import sqy398 from './sqy-398.json';
import sqy400 from './sqy-400.json';
import sqy404 from './sqy-404.json';
import sqy406 from './sqy-406.json';
import sqy410 from './sqy-410.json';
import sqy411 from './sqy-411.json';
import sqy413 from './sqy-413.json';
import sqy414 from './sqy-414.json';
import sqy417 from './sqy-417.json';
import sqy420 from './sqy-420.json';
import sqy424 from './sqy-424.json';
import sqy425 from './sqy-425.json';
import sqy426 from './sqy-426.json';
import sqy428 from './sqy-428.json';
import sqy430 from './sqy-430.json';
import sqy431 from './sqy-431.json';
import sqy432 from './sqy-432.json';
import sqy433 from './sqy-433.json';
import sqy434 from './sqy-434.json';
import sqy435 from './sqy-435.json';
import sqy436 from './sqy-436.json';
import sqy437 from './sqy-437.json';
import sqy438 from './sqy-438.json';
import sqy440 from './sqy-440.json';
import sqy442 from './sqy-442.json';
import sqy447 from './sqy-447.json';
import sqy448 from './sqy-448.json';
import sqy451 from './sqy-451.json';
import sqy452 from './sqy-452.json';
import sqy453 from './sqy-453.json';
import sqy454 from './sqy-454.json';
import sqy455 from './sqy-455.json';
import sqy457 from './sqy-457.json';
import sqy458 from './sqy-458.json';
import sqy459 from './sqy-459.json';
import sqy460 from './sqy-460.json';
import sqy464 from './sqy-464.json';
import sqy465 from './sqy-465.json';
import sqy466 from './sqy-466.json';
import sqy467 from './sqy-467.json';
import sqy469 from './sqy-469.json';
import sqy470 from './sqy-470.json';
import sqy471 from './sqy-471.json';
import sqy484 from './sqy-484.json';
import sqy486 from './sqy-486.json';
import sqy487 from './sqy-487.json';
import sqy489 from './sqy-489.json';
import sqy493 from './sqy-493.json';
import sqy494 from './sqy-494.json';
import sqy500 from './sqy-500.json';
import sqy501 from './sqy-501.json';
import sqy505 from './sqy-505.json';
import sqy508 from './sqy-508.json';
import sqy509 from './sqy-509.json';
import sqy520 from './sqy-520.json';
import sqy526 from './sqy-526.json';
import sqy527 from './sqy-527.json';
import sqy532 from './sqy-532.json';
import sqy536 from './sqy-536.json';
import sqy540 from './sqy-540.json';
import sqy542 from './sqy-542.json';
import sqy543 from './sqy-543.json';
import sqy547 from './sqy-547.json';

export const puzzles: Puzzle[] = [
  cg003 as Puzzle,
  cg007 as Puzzle,
  cg009 as Puzzle,
  cg010 as Puzzle,
  cg011 as Puzzle,
  cg012 as Puzzle,
  cg013 as Puzzle,
  cg014 as Puzzle,
  cg015 as Puzzle,
  cg016 as Puzzle,
  cg019 as Puzzle,
  cg020 as Puzzle,
  cg021 as Puzzle,
  cg022 as Puzzle,
  cg023 as Puzzle,
  cg024 as Puzzle,
  cg025 as Puzzle,
  cg026 as Puzzle,
  cg027 as Puzzle,
  cg028 as Puzzle,
  cg029 as Puzzle,
  cg030 as Puzzle,
  cg031 as Puzzle,
  cg033 as Puzzle,
  cg035 as Puzzle,
  cg037 as Puzzle,
  cg038 as Puzzle,
  cg039 as Puzzle,
  cg040 as Puzzle,
  cg042 as Puzzle,
  cg044 as Puzzle,
  cg046 as Puzzle,
  cg047 as Puzzle,
  cg049 as Puzzle,
  cg050 as Puzzle,
  cg051 as Puzzle,
  cg052 as Puzzle,
  cg053 as Puzzle,
  cg054 as Puzzle,
  cg055 as Puzzle,
  cg056 as Puzzle,
  cg057 as Puzzle,
  cg058 as Puzzle,
  cg059 as Puzzle,
  cg060 as Puzzle,
  cg061 as Puzzle,
  cg062 as Puzzle,
  cg063 as Puzzle,
  cg064 as Puzzle,
  cg065 as Puzzle,
  cg066 as Puzzle,
  cg067 as Puzzle,
  cg068 as Puzzle,
  cg069 as Puzzle,
  cg070 as Puzzle,
  cg071 as Puzzle,
  cg072 as Puzzle,
  cg073 as Puzzle,
  cg074 as Puzzle,
  cg075 as Puzzle,
  cg076 as Puzzle,
  cg077 as Puzzle,
  cg078 as Puzzle,
  cg080 as Puzzle,
  cg081 as Puzzle,
  cg082 as Puzzle,
  cg083 as Puzzle,
  cg084 as Puzzle,
  cg085 as Puzzle,
  cg086 as Puzzle,
  cg087 as Puzzle,
  cg089 as Puzzle,
  cg090 as Puzzle,
  cg091 as Puzzle,
  cg092 as Puzzle,
  cg093 as Puzzle,
  cg094 as Puzzle,
  cg095 as Puzzle,
  cg096 as Puzzle,
  cg097 as Puzzle,
  cg098 as Puzzle,
  cg099 as Puzzle,
  cg100 as Puzzle,
  cg101 as Puzzle,
  cg103 as Puzzle,
  cg104 as Puzzle,
  cg105 as Puzzle,
  cg106 as Puzzle,
  cg107 as Puzzle,
  cg109 as Puzzle,
  cg110 as Puzzle,
  cg111 as Puzzle,
  cg112 as Puzzle,
  cg113 as Puzzle,
  cg114 as Puzzle,
  cg115 as Puzzle,
  cg116 as Puzzle,
  cg117 as Puzzle,
  cg118 as Puzzle,
  cg119 as Puzzle,
  cg120 as Puzzle,
  cg121 as Puzzle,
  cg122 as Puzzle,
  cg123 as Puzzle,
  cg124 as Puzzle,
  cg125 as Puzzle,
  cg126 as Puzzle,
  cg127 as Puzzle,
  cg128 as Puzzle,
  cg129 as Puzzle,
  cg130 as Puzzle,
  cg131 as Puzzle,
  cg132 as Puzzle,
  cg133 as Puzzle,
  cg134 as Puzzle,
  cg136 as Puzzle,
  cg137 as Puzzle,
  cg138 as Puzzle,
  cg139 as Puzzle,
  cg140 as Puzzle,
  cg141 as Puzzle,
  cg142 as Puzzle,
  cg144 as Puzzle,
  cg146 as Puzzle,
  cg147 as Puzzle,
  cg148 as Puzzle,
  cg150 as Puzzle,
  cg151 as Puzzle,
  cg152 as Puzzle,
  cg153 as Puzzle,
  cg154 as Puzzle,
  cg155 as Puzzle,
  cg156 as Puzzle,
  cg157 as Puzzle,
  cg158 as Puzzle,
  cg159 as Puzzle,
  cg160 as Puzzle,
  cg161 as Puzzle,
  cg162 as Puzzle,
  cg163 as Puzzle,
  cg164 as Puzzle,
  cg165 as Puzzle,
  cg166 as Puzzle,
  cg167 as Puzzle,
  cg168 as Puzzle,
  cg170 as Puzzle,
  cg173 as Puzzle,
  cg174 as Puzzle,
  cg175 as Puzzle,
  cg177 as Puzzle,
  cg178 as Puzzle,
  cg179 as Puzzle,
  cg180 as Puzzle,
  cg182 as Puzzle,
  cg183 as Puzzle,
  cg185 as Puzzle,
  cg186 as Puzzle,
  cg187 as Puzzle,
  cg188 as Puzzle,
  cg189 as Puzzle,
  cg190 as Puzzle,
  cg191 as Puzzle,
  cg192 as Puzzle,
  cg194 as Puzzle,
  cg195 as Puzzle,
  cg196 as Puzzle,
  cg197 as Puzzle,
  cg199 as Puzzle,
  cg200 as Puzzle,
  cg201 as Puzzle,
  cg203 as Puzzle,
  cg204 as Puzzle,
  cg205 as Puzzle,
  cg206 as Puzzle,
  cg207 as Puzzle,
  cg208 as Puzzle,
  cg209 as Puzzle,
  cg210 as Puzzle,
  cg211 as Puzzle,
  cg212 as Puzzle,
  cg215 as Puzzle,
  cg216 as Puzzle,
  cg217 as Puzzle,
  cg218 as Puzzle,
  cg219 as Puzzle,
  cg220 as Puzzle,
  cg221 as Puzzle,
  cg222 as Puzzle,
  cg224 as Puzzle,
  cg225 as Puzzle,
  cg226 as Puzzle,
  cg229 as Puzzle,
  cg231 as Puzzle,
  cg232 as Puzzle,
  cg233 as Puzzle,
  cg235 as Puzzle,
  cg236 as Puzzle,
  cg237 as Puzzle,
  cg238 as Puzzle,
  cg239 as Puzzle,
  cg240 as Puzzle,
  cg241 as Puzzle,
  cg242 as Puzzle,
  cg243 as Puzzle,
  cg244 as Puzzle,
  cg245 as Puzzle,
  cg246 as Puzzle,
  cg248 as Puzzle,
  cg249 as Puzzle,
  cg250 as Puzzle,
  cg251 as Puzzle,
  cg252 as Puzzle,
  cg253 as Puzzle,
  cg254 as Puzzle,
  cg255 as Puzzle,
  cg256 as Puzzle,
  cg258 as Puzzle,
  cg259 as Puzzle,
  cg261 as Puzzle,
  cg262 as Puzzle,
  cg263 as Puzzle,
  cg264 as Puzzle,
  cg265 as Puzzle,
  cg266 as Puzzle,
  cg270 as Puzzle,
  cg271 as Puzzle,
  cg274 as Puzzle,
  cg275 as Puzzle,
  cg276 as Puzzle,
  cg277 as Puzzle,
  cg278 as Puzzle,
  cg279 as Puzzle,
  cg280 as Puzzle,
  cg281 as Puzzle,
  cg282 as Puzzle,
  cg283 as Puzzle,
  cg284 as Puzzle,
  cg285 as Puzzle,
  cg286 as Puzzle,
  cg288 as Puzzle,
  cg289 as Puzzle,
  cg290 as Puzzle,
  cg291 as Puzzle,
  cg292 as Puzzle,
  cg293 as Puzzle,
  cg294 as Puzzle,
  cg295 as Puzzle,
  cg296 as Puzzle,
  cg297 as Puzzle,
  cg298 as Puzzle,
  cg299 as Puzzle,
  cg300 as Puzzle,
  cg301 as Puzzle,
  cg302 as Puzzle,
  cg303 as Puzzle,
  cg304 as Puzzle,
  cg305 as Puzzle,
  cg306 as Puzzle,
  cg307 as Puzzle,
  cg308 as Puzzle,
  cg309 as Puzzle,
  cg310 as Puzzle,
  cg311 as Puzzle,
  cg312 as Puzzle,
  cg313 as Puzzle,
  cg316 as Puzzle,
  cg317 as Puzzle,
  cg318 as Puzzle,
  cg319 as Puzzle,
  cg320 as Puzzle,
  cg321 as Puzzle,
  cg323 as Puzzle,
  cg325 as Puzzle,
  cg328 as Puzzle,
  cg329 as Puzzle,
  cg330 as Puzzle,
  cg331 as Puzzle,
  cg332 as Puzzle,
  cg333 as Puzzle,
  cg334 as Puzzle,
  cg335 as Puzzle,
  cg336 as Puzzle,
  cg338 as Puzzle,
  cg339 as Puzzle,
  cg341 as Puzzle,
  cg342 as Puzzle,
  cg344 as Puzzle,
  cg345 as Puzzle,
  cg346 as Puzzle,
  cg347 as Puzzle,
  cg348 as Puzzle,
  cg349 as Puzzle,
  cg351 as Puzzle,
  cg352 as Puzzle,
  cg353 as Puzzle,
  cg354 as Puzzle,
  cg355 as Puzzle,
  cg356 as Puzzle,
  cg357 as Puzzle,
  cg358 as Puzzle,
  cg359 as Puzzle,
  cg360 as Puzzle,
  sqy001 as Puzzle,
  sqy003 as Puzzle,
  sqy004 as Puzzle,
  sqy005 as Puzzle,
  sqy007 as Puzzle,
  sqy008 as Puzzle,
  sqy012 as Puzzle,
  sqy013 as Puzzle,
  sqy014 as Puzzle,
  sqy015 as Puzzle,
  sqy016 as Puzzle,
  sqy019 as Puzzle,
  sqy020 as Puzzle,
  sqy021 as Puzzle,
  sqy022 as Puzzle,
  sqy024 as Puzzle,
  sqy028 as Puzzle,
  sqy029 as Puzzle,
  sqy031 as Puzzle,
  sqy032 as Puzzle,
  sqy033 as Puzzle,
  sqy034 as Puzzle,
  sqy035 as Puzzle,
  sqy036 as Puzzle,
  sqy037 as Puzzle,
  sqy038 as Puzzle,
  sqy040 as Puzzle,
  sqy041 as Puzzle,
  sqy042 as Puzzle,
  sqy043 as Puzzle,
  sqy044 as Puzzle,
  sqy046 as Puzzle,
  sqy049 as Puzzle,
  sqy053 as Puzzle,
  sqy054 as Puzzle,
  sqy055 as Puzzle,
  sqy057 as Puzzle,
  sqy058 as Puzzle,
  sqy060 as Puzzle,
  sqy061 as Puzzle,
  sqy062 as Puzzle,
  sqy063 as Puzzle,
  sqy070 as Puzzle,
  sqy072 as Puzzle,
  sqy075 as Puzzle,
  sqy076 as Puzzle,
  sqy078 as Puzzle,
  sqy081 as Puzzle,
  sqy082 as Puzzle,
  sqy083 as Puzzle,
  sqy084 as Puzzle,
  sqy085 as Puzzle,
  sqy086 as Puzzle,
  sqy087 as Puzzle,
  sqy088 as Puzzle,
  sqy089 as Puzzle,
  sqy090 as Puzzle,
  sqy092 as Puzzle,
  sqy093 as Puzzle,
  sqy095 as Puzzle,
  sqy096 as Puzzle,
  sqy097 as Puzzle,
  sqy098 as Puzzle,
  sqy099 as Puzzle,
  sqy100 as Puzzle,
  sqy101 as Puzzle,
  sqy104 as Puzzle,
  sqy105 as Puzzle,
  sqy106 as Puzzle,
  sqy108 as Puzzle,
  sqy110 as Puzzle,
  sqy111 as Puzzle,
  sqy112 as Puzzle,
  sqy116 as Puzzle,
  sqy118 as Puzzle,
  sqy119 as Puzzle,
  sqy120 as Puzzle,
  sqy122 as Puzzle,
  sqy124 as Puzzle,
  sqy125 as Puzzle,
  sqy128 as Puzzle,
  sqy129 as Puzzle,
  sqy131 as Puzzle,
  sqy132 as Puzzle,
  sqy135 as Puzzle,
  sqy136 as Puzzle,
  sqy137 as Puzzle,
  sqy138 as Puzzle,
  sqy139 as Puzzle,
  sqy140 as Puzzle,
  sqy141 as Puzzle,
  sqy142 as Puzzle,
  sqy143 as Puzzle,
  sqy144 as Puzzle,
  sqy145 as Puzzle,
  sqy146 as Puzzle,
  sqy149 as Puzzle,
  sqy150 as Puzzle,
  sqy151 as Puzzle,
  sqy152 as Puzzle,
  sqy153 as Puzzle,
  sqy154 as Puzzle,
  sqy156 as Puzzle,
  sqy157 as Puzzle,
  sqy159 as Puzzle,
  sqy160 as Puzzle,
  sqy161 as Puzzle,
  sqy162 as Puzzle,
  sqy163 as Puzzle,
  sqy164 as Puzzle,
  sqy166 as Puzzle,
  sqy167 as Puzzle,
  sqy168 as Puzzle,
  sqy169 as Puzzle,
  sqy170 as Puzzle,
  sqy171 as Puzzle,
  sqy172 as Puzzle,
  sqy175 as Puzzle,
  sqy176 as Puzzle,
  sqy177 as Puzzle,
  sqy178 as Puzzle,
  sqy179 as Puzzle,
  sqy180 as Puzzle,
  sqy181 as Puzzle,
  sqy184 as Puzzle,
  sqy185 as Puzzle,
  sqy187 as Puzzle,
  sqy188 as Puzzle,
  sqy189 as Puzzle,
  sqy191 as Puzzle,
  sqy193 as Puzzle,
  sqy194 as Puzzle,
  sqy195 as Puzzle,
  sqy197 as Puzzle,
  sqy198 as Puzzle,
  sqy199 as Puzzle,
  sqy200 as Puzzle,
  sqy201 as Puzzle,
  sqy202 as Puzzle,
  sqy204 as Puzzle,
  sqy205 as Puzzle,
  sqy209 as Puzzle,
  sqy210 as Puzzle,
  sqy211 as Puzzle,
  sqy212 as Puzzle,
  sqy215 as Puzzle,
  sqy216 as Puzzle,
  sqy218 as Puzzle,
  sqy219 as Puzzle,
  sqy220 as Puzzle,
  sqy221 as Puzzle,
  sqy222 as Puzzle,
  sqy223 as Puzzle,
  sqy224 as Puzzle,
  sqy225 as Puzzle,
  sqy227 as Puzzle,
  sqy228 as Puzzle,
  sqy229 as Puzzle,
  sqy230 as Puzzle,
  sqy231 as Puzzle,
  sqy232 as Puzzle,
  sqy233 as Puzzle,
  sqy235 as Puzzle,
  sqy237 as Puzzle,
  sqy238 as Puzzle,
  sqy239 as Puzzle,
  sqy240 as Puzzle,
  sqy243 as Puzzle,
  sqy245 as Puzzle,
  sqy246 as Puzzle,
  sqy248 as Puzzle,
  sqy250 as Puzzle,
  sqy251 as Puzzle,
  sqy252 as Puzzle,
  sqy254 as Puzzle,
  sqy255 as Puzzle,
  sqy256 as Puzzle,
  sqy257 as Puzzle,
  sqy258 as Puzzle,
  sqy259 as Puzzle,
  sqy260 as Puzzle,
  sqy263 as Puzzle,
  sqy264 as Puzzle,
  sqy266 as Puzzle,
  sqy267 as Puzzle,
  sqy268 as Puzzle,
  sqy270 as Puzzle,
  sqy271 as Puzzle,
  sqy272 as Puzzle,
  sqy273 as Puzzle,
  sqy274 as Puzzle,
  sqy275 as Puzzle,
  sqy277 as Puzzle,
  sqy278 as Puzzle,
  sqy280 as Puzzle,
  sqy282 as Puzzle,
  sqy283 as Puzzle,
  sqy284 as Puzzle,
  sqy285 as Puzzle,
  sqy287 as Puzzle,
  sqy289 as Puzzle,
  sqy290 as Puzzle,
  sqy291 as Puzzle,
  sqy294 as Puzzle,
  sqy295 as Puzzle,
  sqy299 as Puzzle,
  sqy300 as Puzzle,
  sqy301 as Puzzle,
  sqy303 as Puzzle,
  sqy304 as Puzzle,
  sqy307 as Puzzle,
  sqy308 as Puzzle,
  sqy311 as Puzzle,
  sqy312 as Puzzle,
  sqy316 as Puzzle,
  sqy319 as Puzzle,
  sqy321 as Puzzle,
  sqy323 as Puzzle,
  sqy324 as Puzzle,
  sqy327 as Puzzle,
  sqy328 as Puzzle,
  sqy329 as Puzzle,
  sqy332 as Puzzle,
  sqy333 as Puzzle,
  sqy335 as Puzzle,
  sqy338 as Puzzle,
  sqy339 as Puzzle,
  sqy341 as Puzzle,
  sqy345 as Puzzle,
  sqy349 as Puzzle,
  sqy350 as Puzzle,
  sqy351 as Puzzle,
  sqy352 as Puzzle,
  sqy353 as Puzzle,
  sqy354 as Puzzle,
  sqy355 as Puzzle,
  sqy356 as Puzzle,
  sqy357 as Puzzle,
  sqy358 as Puzzle,
  sqy361 as Puzzle,
  sqy362 as Puzzle,
  sqy363 as Puzzle,
  sqy364 as Puzzle,
  sqy366 as Puzzle,
  sqy367 as Puzzle,
  sqy368 as Puzzle,
  sqy369 as Puzzle,
  sqy370 as Puzzle,
  sqy371 as Puzzle,
  sqy372 as Puzzle,
  sqy375 as Puzzle,
  sqy376 as Puzzle,
  sqy379 as Puzzle,
  sqy380 as Puzzle,
  sqy383 as Puzzle,
  sqy384 as Puzzle,
  sqy386 as Puzzle,
  sqy387 as Puzzle,
  sqy389 as Puzzle,
  sqy390 as Puzzle,
  sqy392 as Puzzle,
  sqy394 as Puzzle,
  sqy395 as Puzzle,
  sqy396 as Puzzle,
  sqy397 as Puzzle,
  sqy398 as Puzzle,
  sqy400 as Puzzle,
  sqy404 as Puzzle,
  sqy406 as Puzzle,
  sqy410 as Puzzle,
  sqy411 as Puzzle,
  sqy413 as Puzzle,
  sqy414 as Puzzle,
  sqy417 as Puzzle,
  sqy420 as Puzzle,
  sqy424 as Puzzle,
  sqy425 as Puzzle,
  sqy426 as Puzzle,
  sqy428 as Puzzle,
  sqy430 as Puzzle,
  sqy431 as Puzzle,
  sqy432 as Puzzle,
  sqy433 as Puzzle,
  sqy434 as Puzzle,
  sqy435 as Puzzle,
  sqy436 as Puzzle,
  sqy437 as Puzzle,
  sqy438 as Puzzle,
  sqy440 as Puzzle,
  sqy442 as Puzzle,
  sqy447 as Puzzle,
  sqy448 as Puzzle,
  sqy451 as Puzzle,
  sqy452 as Puzzle,
  sqy453 as Puzzle,
  sqy454 as Puzzle,
  sqy455 as Puzzle,
  sqy457 as Puzzle,
  sqy458 as Puzzle,
  sqy459 as Puzzle,
  sqy460 as Puzzle,
  sqy464 as Puzzle,
  sqy465 as Puzzle,
  sqy466 as Puzzle,
  sqy467 as Puzzle,
  sqy469 as Puzzle,
  sqy470 as Puzzle,
  sqy471 as Puzzle,
  sqy484 as Puzzle,
  sqy486 as Puzzle,
  sqy487 as Puzzle,
  sqy489 as Puzzle,
  sqy493 as Puzzle,
  sqy494 as Puzzle,
  sqy500 as Puzzle,
  sqy501 as Puzzle,
  sqy505 as Puzzle,
  sqy508 as Puzzle,
  sqy509 as Puzzle,
  sqy520 as Puzzle,
  sqy526 as Puzzle,
  sqy527 as Puzzle,
  sqy532 as Puzzle,
  sqy536 as Puzzle,
  sqy540 as Puzzle,
  sqy542 as Puzzle,
  sqy543 as Puzzle,
  sqy547 as Puzzle,
];

export function getPuzzleById(id: string | undefined): Puzzle | undefined {
  if (!id) return undefined;
  return puzzles.find((p) => p.id === id);
}

export function allPuzzleTags(): string[] {
  return sortPuzzleTags(puzzles.flatMap((p) => p.tags));
}

export type PuzzleFilter = { tags?: string[] };

export function filterPuzzles(filter: PuzzleFilter = {}): Puzzle[] {
  const tags = filter.tags ?? [];
  if (tags.length === 0) return puzzles;
  return puzzles.filter((p) => tags.every((t) => p.tags.includes(t)));
}

export function puzzleTagFacetCounts(filter: PuzzleFilter = {}): Record<string, number> {
  const base = filterPuzzles(filter);
  const counts: Record<string, number> = {};
  for (const p of base) {
    for (const tag of p.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

export function puzzleMetaLine(puzzle: Puzzle): string {
  const tags = puzzle.tags.filter((t) => t !== '中级' && t !== '高级').slice(0, 3);
  const stars = '★'.repeat(puzzle.difficulty) + '☆'.repeat(Math.max(0, 5 - puzzle.difficulty));
  return tags.length > 0 ? `${tags.join(' · ')} · ${stars}` : stars;
}

export function nextPuzzleId(currentId: string): string | null {
  const i = puzzles.findIndex((p) => p.id === currentId);
  if (i < 0 || i + 1 >= puzzles.length) return null;
  return puzzles[i + 1].id;
}
