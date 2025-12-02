//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// 1. CONEXIÓN
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "todolistDB" });
    console.log("Conectado a MongoDB: todolistDB");
  } catch (err) {
    console.error("Error de conexión:", err);
  }
};
connectDB();

// 2. ESQUEMAS Y MODELOS

// --- Esquema de Items (Tareas individuales) ---
const itemsSchema = new mongoose.Schema({
  name: String // Cambiamos 'text' por 'name' por convención estándar
});

// Modelo para la colección 'items' (Lista General)
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Comprar comida"
});

const item2 = new Item({
  name: "Hacer trabajo"
});

const item3 = new Item({
  name: "Hacer excel"
});

const defaultItems = [item1, item2, item3];


// --- Esquema de Listas (Listas personalizadas) ---
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema] // ¡Esto es clave! Embebemos una lista de items dentro de la lista
});

// Modelo para la colección 'lists' (Lista Work, etc.)
const List = mongoose.model("List", listSchema);


// --- RUTAS ---

app.get("/", async function (req, res) {
  const day = date.getDate();

  try {
    // A. Buscamos tareas para la columna GENERAL (Colección 'items')
    let generalItems = await Item.find({});

    // Si la lista general está vacía, insertamos los defaults
    if (generalItems.length === 0) {
      await Item.insertMany(defaultItems);
      generalItems = await Item.find({}); // Recargamos
    }

    // B. Buscamos TODAS las listas personalizadas
    const customLists = await List.find({});

    // Renderizamos enviando AMBAS listas
    res.render("list", {
      listTitle: day,
      generalItems: generalItems,
      customLists: customLists
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});


// RUTA POST: AGREGAR TAREA
app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.listName; // "General" o el nombre de una lista personalizada

  // Validación básica
  if (!itemName || itemName.trim() === "") return res.redirect("/");

  const newItem = new Item({
    name: itemName
  });

  if (listName === "General") {
    // Guardar en colección 'items'
    await newItem.save();
    res.redirect("/");
  } else {
    // Guardar en colección 'lists' (dentro del documento correspondiente)
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(newItem); // Añadimos al array
        await foundList.save();        // Guardamos la lista actualizada
      }
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  }
});


// RUTA POST: BORRAR TAREA
app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.uid;
  const listName = req.body.listName;

  if (listName === "General") {
    // Borrar de colección 'items'
    try {
      await Item.findByIdAndDelete(checkedItemId);
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } else {
    // Borrar de colección 'lists' (usando $pull de MongoDB)
    try {
      // Buscamos la lista por nombre y sacamos ($pull) el item cuyo _id coincida
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  }
});

// RUTA POST: CREAR NUEVA LISTA
app.post("/create-list", async function (req, res) {
  const listName = req.body.newListName;

  if (!listName || listName.trim() === "") return res.redirect("/");

  try {
    const existingList = await List.findOne({ name: listName });
    if (!existingList) {
      const list = new List({
        name: listName,
        items: defaultItems
      });
      await list.save();
    }
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

// RUTA POST: BORRAR LISTA
app.post("/delete-list", async function (req, res) {
  const listId = req.body.listId;

  try {
    await List.findByIdAndDelete(listId);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});