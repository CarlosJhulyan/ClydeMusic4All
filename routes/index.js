const express = require('express');
const router = express.Router();
const sequelize = require('../conecction');
const { translate } = require('@vitalets/google-translate-api');

router.get('/', async (req, res, next) => {
  const { user, pass } = req.query;
  try {
    const dat = await sequelize(user, pass).query('select * from dbo.Artist');
    res.render('index', {
      title: 'Hola'
    })
  } catch (e) {
    const text = await translate(e.message, {to: 'es',from: 'en'});
    console.log(text);
  }
});

router.get('/login', function(req, res, next) {
  res.render('login', {
    title: 'ClydeMusic4All',
  });
});

router.post('/newUSer', async (req, res) => {
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

module.exports = router;
