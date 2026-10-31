import test from 'node:test';
import assert from 'node:assert/strict';
import {distribution,quantile,csvForWells} from '../src/result-data.mjs';
import {simulate} from '../server/simulator.mjs';
const protocol={dose:20,glucose:11,replicates:32,seed:42};
test('distribution uses all wells and interpolated quartiles without inventing observations',()=>{const wells=[1,2,3,4].map((v,i)=>({id:`A${i+1}`,group:'Vehicle',insulin:v,viability:100-v}));assert.deepEqual(distribution(wells,'insulin'),[{group:'Vehicle',n:4,min:1,q1:1.75,median:2.5,q3:3.25,max:4}]);assert.equal(quantile([],0.5),null);assert.equal(quantile([7],.25),7);assert.deepEqual(wells.map(w=>w.insulin),[1,2,3,4]);});
test('full-size assay exports all 96 wells and all groups rather than the first 24',()=>{const result=simulate(protocol),stats=distribution(result.wells,'viability');assert.deepEqual(stats.map(s=>s.n),[32,32,32]);assert.ok(stats.every(s=>s.min<=s.q1&&s.q1<=s.median&&s.median<=s.q3&&s.q3<=s.max));const csv=csvForWells(result.wells);assert.equal(csv.split('\r\n').length,97);assert.ok(csv.includes('"C32"'));assert.ok(csv.startsWith('well,group,insulin_AU,viability_percent'));});
test('CSV quotes delimiters and embedded quotes correctly',()=>{assert.equal(csvForWells([{id:'A1',group:'A, "group"',insulin:2,viability:95}]).split('\r\n')[1],'"A1","A, ""group""","2","95"');});
