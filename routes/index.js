const express = require('express');
const router = express.Router();
const sequelize = require('../conecction');
const { translate } = require('@vitalets/google-translate-api');
const {success, error} = require("../utils/customResponse");
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
const { QueryTypes } = require('sequelize');
const moment = require('moment');

router.get('/', async (req, res, next) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  try {
    if (username.length > 0 && password.length > 0) res.redirect('/dashboard');
    else res.redirect('/login');
  } catch (e) {
    const text = await translate(e.message, {to: 'es',from: 'en'});
  }
});


router.get('/login', function(req, res, next) {
  res.render('login');
});

router.put('/changePassword', function(req, res, next) {
  res.render('changePassword');
});

router.get('/sign-out', function(req, res, next) {
  localStorage.removeItem('password');
  localStorage.removeItem('username');
  res.redirect('/login');
});



router.post('/sign-in', async (req, res) => {
  const { user, password } = req.body;

  try {
    await sequelize(user, password).authenticate();
    
    localStorage.setItem('username', user);
    localStorage.setItem('password', password);
    return res.render('index', {
      title: 'Ingreso exitoso'
    });
  } catch (e) {
    
    return res.render('login', {
      error: e.message,
    });
  }
});

router.post('/newUser', async (req, res) => {
  const { username, password } = req.body;
  try {
    //const dat = await sequelize.query('EXEC dbo.createNewUser \'' + username + '\',' + '\'' + password +  '\';');
    const dat = await sequelize('Jhulyan', 'CJdeveloper%989%').query('select * from dbo.Artist');
    res.send({
      data: dat,
      message: 'Se creo correctamente el usuario',
    });
  } catch (e) {
    translate(e.message, {to: 'es',from: 'en'}).then(response => {
      res.send(response.text).status(203);
    }).catch(err => {
      res.send(e.message).status(203);
    });
  }
});

router.get('/databases', async (req, res) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');

  try {
    const databases = await sequelize(username, password)
      .query(
        `select * from sys.databases order by create_date desc`
        , {
          type: QueryTypes.SELECT,
        });

    const dataFormat = databases.map(item => ({
      ...item,
      create_date: moment(item.create_date).format('DD/MM/yyyy'),
    }));

    res.render('databases', {
      title: 'Bases de datos',
      databases: dataFormat || [],
    });
  } catch (e) {
    res.render('databases', {
      title: 'Bases de datos',
      message: e.message,
    });
  }
});

router.get('/showDatabase/:name', async (req, res)=>{
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const {name} = req.params;

  try{
    const tables = await sequelize(username, password, name)
      .query(
        `SELECT * FROM sys.tables`
        , {
          type: QueryTypes.SELECT,
        });
    
    const dataFormat = tables.map(item => ({
      ...item,
      create_date: moment(item.create_date).format('DD/MM/yyyy'),
      modify_date: moment(item.modify_date).format('DD/MM/yyyy'),
    }));
    res.render('showDatabase', {
      title: name,
      tables: dataFormat || [],
    });
  }
  catch(e){
    res.render('showDatabase', {
      title: name,
      message: e.message,
    });
  }
})

router.get('/table', async (req, res)=>{
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const { database, table } = req.query;

  try{
    const headers = await sequelize(username, password, database)
      .query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = 'dbo'
         AND TABLE_NAME = '${table}'
         ORDER BY ORDINAL_POSITION`
         ,{
          type: QueryTypes.SELECT,
        });

    const tables = await sequelize(username, password, database)
      .query(`SELECT * FROM ${table}`, {
          type: QueryTypes.SELECT,
        });

    res.render('table', {
      title: database,
      headers: headers || [],
      tables: tables || [],
    });
  }
  catch(e){
    console.log(e);
    res.render('table', {
      title: database,
      message: e.message,
    });
  }
})

router.get('/users', async (req, res) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');

  try {
    const users = await sequelize(username, password)
      .query(
        `select * from sys.sql_logins`
        , {
          type: QueryTypes.SELECT,
        });

    const dataFormat = users.map(item => ({
      ...item,
      create_date: moment(item.create_date).format('DD/MM/yyyy'),
      modify_date: moment(item.modify_date).format('DD/MM/yyyy'),
    }));
    //console.log(dataFormat);

    res.render('users', {
      title: 'Lista de Usuarios',
      users: dataFormat || [],
      navigatePassword: (name) =>{
        res.redirect('/users/changePassword/'+name)
      }
    });
  } catch (e) {
    res.render('users', {
      title: 'Lista de Usuarios',
      message: e.message,
    });
  }
});

router.get('/dashboard', async (req, res) => {
  return res.render('index', {
    title: 'Bienvenido'
  });
});

router.get('/usersToDatabase/:name', async (req, res) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const { name }  = req.params;

  try {
    const users = await sequelize(username, password, name)
      .query(`select * from sys.database_principals where type_desc='SQL_USER'`, {
        type: QueryTypes.SELECT,
      });
    
    const dataFormat = users.map(item => ({
      ...item,
      create_date: moment(item.create_date).format('DD/MM/yyyy'),
      modify_date: moment(item.modify_date).format('DD/MM/yyyy'),
    }));

    return res.render('usersToDatabase', {
      title: 'Usuarios de ' + name,
      users: dataFormat || [],
    });
  } catch (error) {
    console.log(error);
    res.render('usersToDatabase', {
      title: 'Lista de Usuarios',
      message: error.message,
    });
  }
});
router.get('/permisosUsers', async (req, res) => {
  const name=req.params.name
  return res.render('permisosUsers', {
    title: 'Cambiar contraseña de '+ name,
    name:name
  });
})

router.get('/changePassword/:name', async (req, res) => {
  const name=req.params.name
  return res.render('changePassword', {
    title: 'Cambiar contraseña de '+ name,
    name:name
  });
})

module.exports = router;

