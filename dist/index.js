"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
// アプリケーションで動作するようにdotenvを設定する
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
app.set("view engine", "ejs");
const PORT = process.env.PORT || 3000;
app.get('/', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const todos = yield prisma.todo.findMany({
        orderBy: {
            updated_at: "desc",
        }
    });
    response.render('index.ejs', { todos });
}));
app.get('/new', (request, response) => {
    response.render('new.ejs');
});
app.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.todo.create({
            data: {
                id: (0, uuid_1.v4)(),
                title: req.body.title,
                body: req.body.contents || null,
                due_date: req.body.due ? new Date(req.body.due) : null
            }
        });
        res.redirect('/');
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Database error");
    }
}));
app.post('/complete/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield prisma.todo.update({
        where: { id },
        data: { completed_at: new Date() },
    });
    res.redirect('/');
}));
app.post('/delete/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.todo.delete({
            where: { id },
        });
        res.redirect('/');
    }
    catch (error) {
        console.error('Delete failed', error);
        res.status(500).send("Failed to delete item.");
    }
}));
app.get('/edit/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = (req.params.id);
    try {
        const todo = yield prisma.todo.findUnique({ where: { id } });
        res.render('edit.ejs', { todo });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Failed to edit item.");
    }
    ;
}));
app.post("/update/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { title, body } = req.body;
    try {
        yield prisma.todo.update({
            where: { id },
            data: {
                title,
                body,
            },
        });
        res.redirect("/");
    }
    catch (error) {
        console.error("Update failed:", error);
        res.status(500).send("Failed to update item.");
    }
}));
app.get("/clone/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const todo = yield prisma.todo.findUnique({ where: { id } });
    if (!todo) {
        res.status(404).send("Todo not found");
        return;
    }
    res.render("clone.ejs", { todo });
}));
app.post("/clone/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { due_date } = req.body;
    const original = yield prisma.todo.findUnique({ where: { id } });
    if (!original) {
        res.status(404).json({ error: "Original not found" });
        return;
    }
    try {
        const clone = yield prisma.todo.create({
            data: {
                title: original.title,
                body: original.body,
                due_date: due_date ? new Date(due_date) : null,
                completed_at: null
            },
        });
        res.redirect('/');
    }
    catch (error) {
        console.error("Duplicate failed", error);
    }
}));
app.get('/find', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, body, from, to, completed } = req.query;
    try {
        const find = yield prisma.todo.findMany({
            where: {
                title: title
                    ? {
                        contains: String(title),
                    }
                    : undefined,
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
                        ? null // 完了していない
                        : undefined, // 指定なし
            },
            orderBy: {
                created_at: "desc",
            }
        });
        res.render('search', { find });
    }
    catch (_a) {
        res.status(500).json({ error: "Failed to fetch todos" });
    }
}));
app.listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
}).on("error", (error) => {
    // エラーの処理
    throw new Error(error.message);
});
