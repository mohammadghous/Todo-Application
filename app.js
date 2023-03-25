const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

app.use(express.json());

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo
    WHERE id = ${todoId}
    `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const createTodoQuery = `
    INSERT INTO 
    todo (id, todo, priority, status)
    VALUES (${id},'${todo}', '${priority}', '${status}');
    `;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    SELECT * FROM todo
    WHERE id = ${todoId}
    `;
  const district = await db.get(deleteTodoQuery);
  response.send("Todo Deleted");
});

app.get("/todos/", async (request, response) => {
  const { priority } = request.query;
  const getTodoListQuery = `
    SELECT * FROM todo
    WHERE priority = '${priority}'
    `;
  const todoListArray = await db.all(getTodoListQuery);
  response.send(todoListArray);
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoRequestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case todoRequestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case todoRequestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case todoRequestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
  }
  const existingTodoValues = `
  SELECT * FROM todo WHERE id = ${todoId};
  `;
  const getDefaultValues = await db.get(existingTodoValues);
  const {
    todo = getDefaultValues.todo,
    priority = getDefaultValues.priority,
    status = getDefaultValues.status,
  } = todoRequestBody;

  const updateRequestedTodoQuery = `
    UPDATE
      todo
    SET
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE id = ${todoId};
      `;
  await db.run(updateRequestedTodoQuery);
  response.send(`${updateColumn} Updated`);
});

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;

  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
      SELECT
        *
        FROM
        todo
        WHERE todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
        SELECT
        *
        FROM
        todo 
        WHERE todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
        SELECT
        *
        FROM
        todo 
        WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;

    default:
      getTodoQuery = `
      SELECT
        *
        FROM
        todo 
        WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});
module.exports = app;
