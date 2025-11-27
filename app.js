//jshint esversion:6
require('dotenv').config(); // Cargar variables de entorno (seguridad)

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); // Importamos Mongoose
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// --- 1. CONEXIÓN A BASE DE DATOS ---
const connectDB = async () => {
  try {
    // Usamos la variable del archivo .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado exitosamente a MongoDB");
  } catch (err) {
    console.error("Error conectando a MongoDB:", err);
    process.exit(1);
  }
};
connectDB();

// --- 2. CREAR EL ESQUEMA (El molde de los datos) ---
const itemsSchema = new mongoose.Schema({
  text: String,       // El texto de la tarea
  listType: String    // "General" o "Work" (para saber dónde va)
});

// --- 3. CREAR EL MODELO (La herramienta para guardar/buscar) ---
const Item = mongoose.model("Item", itemsSchema);


// --- RUTAS ---

// Ruta Principal ÚNICA
// Nota: Ahora usamos 'async' porque la base de datos tarda unos milisegundos en responder
app.get("/", async function (req, res) {
  const day = date.getDate();

  try {
    // Buscamos TODAS las tareas en la base de datos
    const allItems = await Item.find({});

    // Filtramos usando Javascript para separar las listas
    // (Mongoose devuelve un array de objetos con _id, text y listType)
    const generalList = allItems.filter(item => item.listType === "General");
    const workList = allItems.filter(item => item.listType === "Work");

    res.render("list", {
      listTitle: day,
      generalItems: generalList,
      workItems: workList
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error al obtener tareas");
  }
});

// Ruta POST para AGREGAR
app.post("/", async function (req, res) {
  const itemText = req.body.newItem;
  const listName = req.body.listName; // "General" o "Work"

  if (!itemText || itemText.trim() === "") {
    return res.redirect("/");
  }

  // Creamos un nuevo documento usando el Modelo
  const newItem = new Item({
    text: itemText,
    listType: listName
  });

  try {
    // Guardamos en Mongo
    await newItem.save();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

// Ruta POST para ELIMINAR
app.post("/delete", async function (req, res) {
  const idToDelete = req.body.uid; // Ahora recibiremos el _id de Mongo

  try {
    // Buscamos por ID y eliminamos
    await Item.findByIdAndDelete(idToDelete);
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