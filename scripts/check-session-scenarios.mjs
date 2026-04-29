// Quick check: Does session query return scenarios?
const sessionId = '43475493-a0f5-4b3c-8951-4b58ab62f2d9';

const query = `
  query Session($id: ID!) {
    session(id: $id) {
      _id
      scenarioIds
      scenarios {
        _id
        focalNode
        activeEdgeIds
        edgeStates
      }
      focalNode
      sampleSize
    }
  }
`;

fetch('http://localhost:3001/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { id: sessionId } })
})
.then(res => res.json())
.then(data => {
  console.log('\n📊 Session Query Response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.data?.session?.scenarios) {
    console.log(`\n✅ SUCCESS: Session has ${data.data.session.scenarios.length} scenarios`);
    console.log(`   ScenarioIds: ${data.data.session.scenarioIds.length}`);
  } else {
    console.log('\n❌ PROBLEM: No scenarios populated!');
    console.log(`   Session exists: ${!!data.data?.session}`);
    console.log(`   ScenarioIds: ${data.data?.session?.scenarioIds?.length || 0}`);
  }
})
.catch(err => console.error('Error:', err));
