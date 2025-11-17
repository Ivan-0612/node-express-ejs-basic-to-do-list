//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// --- ESTRUCTURA DE DATOS ---
const items = new Map();
const workItems = new Map();

// Datos iniciales
items.set('1', 'Comprar comida');
items.set('2', 'Cocinar la comida');
workItems.set('101', 'Revisar correos');
workItems.set('102', 'Reunión de proyecto');

// --- RUTAS ---

// 1. Ruta Principal ÚNICA 
app.get("/", function (req, res) {
  const day = date.getDate();

  const generalList = Array.from(items, ([uid, text]) => ({ uid, text }));
  const workList = Array.from(workItems, ([uid, text]) => ({ uid, text }));

  res.render("list", {
    listTitle: day,
    generalItems: generalList,
    workItems: workList
  });
});

// 2. Ruta POST para AGREGAR 
app.post("/", function (req, res) {
  const itemText = req.body.newItem;
  const listName = req.body.listName;
  const uid = Date.now().toString(); 

  if (!itemText || itemText.trim() === "") {
     return res.redirect("/");
  }

  if (listName === "Work") {
    workItems.set(uid, itemText);
  } else {
    items.set(uid, itemText);
  }
  
  res.redirect("/");
});

// 3. Ruta POST para ELIMINAR
app.post("/delete", function (req, res) {
  const uidToDelete = req.body.uid;
  const listName = req.body.listName;

  if (listName === "Work") {
    workItems.delete(uidToDelete);
  } else {
    items.delete(uidToDelete);
  }
  
  res.redirect("/");
});

app.get("/about", function (req, res) {
  res.render("about");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});