import fetch from 'node-fetch';

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
      opponentNode
      sampleSize
    }
  }
`;

const sessionId = '43475493-a0f5-4b3c-8951-4b58ab62f2d9';

fetch('http://localhost:3001/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { id: sessionId } })
})
.then(res => res.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
  if (data.data?.session?.scenarios) {
    console.log(`\n✅ Session has ${data.data.session.scenarios.length} scenarios`);
  } else {
    console.log('\n❌ No scenarios populated!');
  }
})
.catch(console.error);
