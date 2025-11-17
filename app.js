//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();

// Configuración esencial
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ESTRUCTURA DE DATOS: MAP 
const items = new Map();
const workItems = new Map();

// Datos iniciales
items.set('1', 'Comprar comida');
items.set('2', 'Cocinar la comida');
items.set('3', 'Comer la comida');

// RUTAS

// 1. Ruta Principal
app.get("/", function (req, res) {
  const day = date.getDate(); 

  const itemList = Array.from(items, ([uid, text]) => ({ uid, text }));

  res.render("list-map", {
    listTitle: day,
    newListItems: itemList
  });
});

// 2. Ruta POST Principal 
app.post("/", function (req, res) {
  const itemText = req.body.newItem;
  const listName = req.body.listName;
  
  const uid = Date.now().toString(); 

  if (!itemText || itemText.trim() === "") {
     return res.redirect(listName === "Work" ? "/work" : "/");
  }

  if (listName === "Work") {
    workItems.set(uid, itemText);
    res.redirect("/work");
  } else {
    items.set(uid, itemText);
    res.redirect("/");
  }
});

// 3. Ruta Work 
app.get("/work", function (req, res) {
  const itemList = Array.from(workItems, ([uid, text]) => ({ uid, text }));
  
  res.render("list-map", {
    listTitle: "Work",
    newListItems: itemList
  });
});

// 4. Ruta Eliminar 
app.post("/delete", function (req, res) {
  const uidToDelete = req.body.uid;
  const listName = req.body.listName;

  if (listName === "Work") {
    workItems.delete(uidToDelete);
    res.redirect("/work");
  } else {
    items.delete(uidToDelete);
    res.redirect("/");
  }
});

// 5. Ruta About
app.get("/about", function (req, res) {
  res.render("about");
});

// SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});