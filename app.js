const addDays = require("date-fns/addDays");
const express = require("express");
const app = express();
const path = require("path");
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000);
  } catch (e) {
    console.log(`error db:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.date;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

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
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, date } = request.query;
  //ON STATUS
  const getALlDetailsOnStatus = `
  select 
   *
  from todo where status = '${status}' 

  `;
  const getDBResOnStatus = await db.all(getALlDetailsOnStatus);
  const getStatusFromDb = getDBResOnStatus.map((each) => each.status);

  // ON PRIORITY
  const getALlDetailsOnPriority = `select 
   *
  from todo where priority = '${priority}' 
  `;

  const getTodoOnPriority = await db.all(getALlDetailsOnPriority);
  const isPriorityIncludes = getTodoOnPriority.map((each) => each.priority);

  // ON CATEGORY
  const getOnCategoryQuery = `
select * from todo where category = '${category}'
`;
  const dbResponseOnCategory = await db.all(getOnCategoryQuery);
  const isCategoryIncludes = dbResponseOnCategory.map((each) => each.category);

  // ON DATE
  const getOnDateQuery = `
  select * from todo where due_date = '${date}'
  `;
  const dbResponseOnDate = await db.all(getOnDateQuery);
  const isDateIncludes = dbResponseOnDate.map((each) => each.due_date);

  if (hasPriorityAndStatusProperties(request.query)) {
    getTodosQuery = `
      SELECT
         id,
        todo,priority,status,category,
        due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
  }
  if (hasPriorityProperty(request.query)) {
    if (isPriorityIncludes.includes(priority)) {
      getTodosQuery = `
      SELECT
         id,
        todo,priority,status,category,
        due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (hasStatusProperty(request.query)) {
    if (getStatusFromDb.includes(status)) {
      getTodosQuery = `
      SELECT
        id,
        todo,priority,status,category,
        due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (hasCategoryProperty(request.query)) {
    if (isCategoryIncludes.includes(category)) {
      getTodosQuery = `
     SELECT
        id,
        todo,priority,status,category,
        due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (hasCategoryAndPriorityProperties(request.query)) {
    getTodosQuery = `
      SELECT
         id,
        todo,priority,status,category,
        due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
  }

  if (hasCategoryAndStatusProperties(request.query)) {
    getTodosQuery = `
      SELECT
         id,
        todo,priority,status,category,
        due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
  }

  if (hasSearchProperty(request.query)) {
    getTodosQuery = `
      SELECT
         id,
        todo,priority,status,category,
        due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        `;
  }

  if (hasDueDateProperty(request.query)) {
    if (isDateIncludes.includes(date)) {
      getTodosQuery = `
                SELECT
                    id,
                    todo,priority,status,category,
                    due_date as dueDate
                FROM
                    todo 
                WHERE
                    todo LIKE '%${search_q}%' and due_date = '${date}'`;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
        select 
         id,
        todo,priority,status,category,
        due_date as dueDate
        from todo where id = ${todoId}
    `;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  const getListOnDateQuery = `
    select 
        id,
        todo,priority,status,category,
        due_date as dueDate
    from todo where due_date = '${date}'
    `;
  const dbResponse = await db.all(getListOnDateQuery);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const addingNewTodo = `
    insert into todo(id,todo,priority,status,category,due_date)
    values('${id}','${todo}','${priority}','${status}','${category}','${dueDate}')
    `;
  await db.run(addingNewTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateText;
  if (request.body.status !== undefined) {
    updateText = "Status";
  }
  if (request.body.todo !== undefined) {
    updateText = "Todo";
  }
  if (request.body.priority !== undefined) {
    updateText = "Priority";
  }
  if (request.body.category !== undefined) {
    updateText = "Category";
  }
  if (request.body.dueDate !== undefined) {
    updateText = "Due Date";
  }
  const getPreviousTodo = `
    select * from todo where id = ${todoId}
    `;

  const dbResponse = await db.get(getPreviousTodo);
  const {
    todo = dbResponse.todo,
    priority = dbResponse.priority,
    status = dbResponse.status,
    category = dbResponse.category,
    dueDate = dbResponse.due_date,
  } = request.body;

  const updateQuery = `
      update todo 
      set todo = '${todo}',
      status = '${status}',
      priority = '${priority}',
      category = '${category}',
      due_date = '${dueDate}'
      where id = ${todoId}
      `;
  await db.run(updateQuery);
  response.send(`${updateText} Updated`);
});

app.delete(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    delete from todo where id = ${todoId}
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
