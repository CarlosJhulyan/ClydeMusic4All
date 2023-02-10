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


router.get('/login', function(req, res) {
  res.render('login');
});

router.post('/changePassword', async (req, res) => {
  const { user, newpassword } = req.body;
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  
  try {
    await sequelize(username, password).query(
      `ALTER LOGIN [${user}] WITH PASSWORD = '${newpassword}';`,
      {
        type: QueryTypes.UPDATE,
      });
    return res.render('changePassword', {
      title: 'Cambiar contraseña de '+ user,
      name: user,
      success: 'Contraseña cambiada correctamente'
    });
  } catch (e) {
    return res.render('changePassword', {
      title: 'Cambiar contraseña de '+ user,
      name: user,
      error: e.message,
    });
  }
});



router.get('/sign-out', function(req, res) {
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

router.post('/newUsers', async (req, res) => {
  const { newUser, newPassword } = req.body;
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  console.log(newUser)
  try {
    await sequelize(username, password)
    .query(`
      CREATE LOGIN ${newUser} WITH PASSWORD = '${newPassword}';
    `);
  await sequelize(username, password, 'Chinook')
    .query(`
      CREATE USER ${newUser} FOR LOGIN ${newUser};
    `);
    return res.render('newUsers', {
      title: 'Nuevo usuario ',
      success: 'Usuario creado correctamente',
    });
  } catch (e) {
    return res.render('newUsers', {
      title: 'Nuevo usuario ',
      error: e.message,
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

    res.render('users', {
      title: 'Lista de Logins',
      users: dataFormat || [],
      navigatePassword: (name) =>{
        res.redirect('/users/changePassword/'+name)
      }
    });
  } catch (e) {
    res.render('users', {
      title: 'Lista de Logins',
      message: e.message,
    });
  }
});

router.get('/assignDatabase', async (req, res) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const { name } = req.query;

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
    
    res.render('assignDatabase', {
      title: 'Lista de Bases de datos',
      databases: dataFormat || [],
      user: name,
    });
  } catch (e) {
    res.render('assignDatabase', {
      title: 'Lista de Bases de datos',
      message: e.message,
      user: name,
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
      name: name,
    });
  } catch (error) {
    console.log(error);
    res.render('usersToDatabase', {
      title: 'Lista de Usuarios',
      message: error.message,
    });
  }
});
router.get('/permissionsUser', async (req, res) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const { database, user } = req.query;

  try {
    const permissions = await sequelize(username, password, database)
      .query(
        `
        SELECT 
          OBJECT_NAME(major_id) AS TableName, 
          user_name(grantee_principal_id) AS UserName, 
          permission_name AS Permission
        FROM 
            sys.database_permissions
        WHERE 
            class = 1 
            AND minor_id = 0 
            AND OBJECT_NAME(major_id) IS NOT NULL
            AND user_name(grantee_principal_id) = '${user}'
        ORDER BY 
            TableName, UserName, Permission
        `, {
          type: QueryTypes.SELECT,
        });
        
    const tables = await sequelize(username, password, database)
      .query(
        `SELECT * FROM sys.tables`
        , {
          type: QueryTypes.SELECT,
        });
        
    const tablesFormat = tables.map(item => {
      const update = permissions.some(x => x.TableName === item.name && x.Permission === 'UPDATE');
      const remove = permissions.some(x => x.TableName === item.name && x.Permission === 'DELETE');
      const select = permissions.some(x => x.TableName === item.name && x.Permission === 'SELECT');
      
      return {
        ...item,
        update: !update,
        select: !select,
        delete: !remove,
      }
    });
    return res.render('permissionsUser', {
      title: 'Permisos de '+ user,
      tables: tablesFormat || [],
      permissions: permissions || [],
      database,
      user,
    });
  } catch (error) {
    return res.render('permissionsUser', {
      title: 'Permisos de '+ user,
      message: error.message,
    });
  }
})

router.get('/changePassword', async (req, res) => {
  const {name} = req.query;
  return res.render('changePassword', {
    title: 'Cambiar contraseña de '+ name,
    name: name
  });
});

router.get('/insertPermission', async (req, res) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const { database, user, type, table } = req.query;

  try {
    await sequelize(username, password)
      .query(`
        EXEC dbo.newPermissionUser
        @type = '${type}',
        @table = '${table}',
        @user = '${user}',
        @database = '${database}'
      `, {
        type: QueryTypes.UPDATE,
      });
    return res.redirect(`/permissionsUser?database=${database}&user=${user}`);
  } catch(e) {
    return res.render('permissionsUser', {
      title: 'Permisos de '+ user,
      message: e.message,
    });
  }
});

router.get('/deletePermission', async (req, res) => {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const { database, user, type, table } = req.query;

  try {
    await sequelize(username, password)
      .query(`
        EXEC dbo.deletePermissionUser
        @type = '${type}',
        @table = '${table}',
        @user = '${user}',
        @database = '${database}'
      `, {
        type: QueryTypes.UPDATE,
      });
    return res.redirect(`/permissionsUser?database=${database}&user=${user}`);
  } catch(e) {
    return res.render('permissionsUser', {
      title: 'Permisos de '+ user,
      message: e.message,
    });
  }
});

router.get('/assignDatabaseAction', async function(req, res) {
  const password = localStorage.getItem('password');
  const username = localStorage.getItem('username');
  const { database, user } = req.query;

  try {
    await sequelize(username, password, database).query(
      `CREATE USER ${user} FOR LOGIN ${user}`
    );

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

    return res.render('assignDatabase', {
      title: 'Lista de Bases de datos',
      databases: dataFormat || [],
      success: 'Se asigno correctamente la BD',
    });
  } catch (e) {
    return res.render('assignDatabase', {
      title: 'Lista de Bases de datos',
      message: e.message,
    });
  }
});

router.get('/newUsers/', async (req, res) => {
  return res.render('newUsers', {
    title: 'Nuevo usuario ',
  });
});

module.exports = router;

