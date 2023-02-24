const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Error at:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchID: dbObject.player_match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;`;

  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};`;

  const playersArray = await db.get(getPlayersQuery);
  response.send(convertDbObjectToResponseObject(playersArray));
});

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `
    UPDATE player_details
    SET player_name='${playerName}'
    WHERE player_id = ${playerId};`;

  const playersArray = await db.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`;

  const matchArray = await db.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject(matchArray));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchId = `
    SELECT match_id FROM player_match_score
    WHERE player_id = ${playerId};`;

  const matchesArray = await db.all(getMatchId);
  const listOfMatches = matchesArray.map((each) => each.match_id);
  const playersArray = `
  SELECT * FROM match_details
  WHERE match_id IN (${listOfMatches});`;
  const players = await db.all(playersArray);
  response.send(
    players.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerId = `
    SELECT player_id FROM player_match_score
    WHERE match_id = ${matchId};`;

  const playerIds = await db.all(getPlayerId);
  const listOfPlayers = playerIds.map((each) => each.player_id);
  const playersArray = `
  SELECT * FROM player_details
  WHERE player_id IN (${listOfPlayers});`;
  const players = await db.all(playersArray);
  response.send(
    players.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT 
      player_details.player_id as playerId,
      player_details.player_name as playerName,
      SUM(player_match_score.score) as totalScore,
      SUM(player_match_score.fours) as totalFours,
      SUM(player_match_score.sixes) as totalSixes
     FROM  player_details INNER JOIN
     player_match_score ON player_details.player_id = player_match_score.player_id
      
    WHERE player_match_score.player_id = ${playerId};`;

  const playersArray = await db.get(getPlayersQuery);
  response.send(playersArray);
});

module.exports = app;
