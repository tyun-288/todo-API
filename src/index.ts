import express, { Request, response, Response } from 'express';
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
const prisma = new PrismaClient();

// アプリケーションで動作するようにdotenvを設定する
dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set("view engine", "ejs");
const PORT = process.env.PORT || 3000;

app.get('/', async (request: Request, response: Response) => {
  const todos=await prisma.todo.findMany({
    orderBy: {
      updated_at: "desc",
    }
  });
  response.render('index.ejs', {todos});
});
app.get('/new', (request, response) => {
  response.render('new.ejs');
})
app.post('/create', async (req, res) => {
  try {
    await prisma.todo.create({
      data: {
        id: uuidv4(),                
        title: req.body.title,
        body: req.body.contents || null,
        due_date: req.body.due ? new Date(req.body.due) : null
      }
    });
    res.redirect('/');
  } catch (error){
    console.error(error);
    res.status(500).send("Database error");
  }
});

app.post('/complete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.todo.update({
    where: { id },
    data: { completed_at: new Date() },
  });
  res.redirect('/');
});

app.post('/delete/:id', async(req: Request, res: Response) => {
  const {id} = req.params;
  try {
    await prisma.todo.delete ({
      where:{id},
    });
    res.redirect('/');
  } catch (error){
    console.error('Delete failed', error);
    res.status(500).send("Failed to delete item.");
  }
});
app.get('/edit/:id', async(req:Request, res: Response) => {
  const id=(req.params.id);
  try {
    const todo=await prisma.todo.findUnique({where:{id}});
    
    res.render('edit.ejs', {todo});
  } catch(error) {
    console.error(error);
    res.status(500).send("Failed to edit item.");
  };
});
app.post("/update/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const { title, body } = req.body;
  try {
    await prisma.todo.update({
      where: { id },
      data: {
        title,
        body,
      },
    });
    res.redirect("/");
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).send("Failed to update item.");
  }
});
app.get("/clone/:id", async(req: Request, res: Response)=> {
  const id =req.params.id;
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    res.status(404).send("Todo not found");
    return;
  }
  res.render("clone.ejs", { todo });
});
app.post("/clone/:id", async(req: Request, res: Response) => {
  const id=req.params.id;
  const {due_date}=req.body;
  const original= await prisma.todo.findUnique({where: {id}});
  if(!original) {
    res.status(404).json({error:"Original not found"});
    return;
  }
  try { 
    const clone= await prisma.todo.create({
      data: {
        title: original.title,
        body: original.body,
        due_date: due_date ? new Date(due_date) : null,
        completed_at: null
      },
    });
    res.redirect('/');
  } catch(error) {
    console.error("Duplicate failed", error);
  }
});
app.get('/find', async(req: Request, res: Response) => {
  const{ title, body,from, to, completed } = req.query;
  try{
    const find = await prisma.todo.findMany({
      where: {
        title: title
        ? {
          contains: String(title),
        }
        :undefined,
        body: body ? {
          contains: String(body),
        } : undefined,
        due_date: from || to ? {
          gte: from ? new Date(String(from)) : undefined,
          lte: to ? new Date(String(to)) : undefined,
           } : undefined,
          completed_at: completed === "true"
      ? { not: null } // 完了している
      : completed === "false"
        ? null         // 完了していない
        : undefined,   // 指定なし
      },
      orderBy: {
        created_at: "desc",
      }
      });
      res.render('search', {find});
    } catch {
      res.status(500).json({error: "Failed to fetch todos"});
    }
});
app.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  // エラーの処理
  throw new Error(error.message);
});