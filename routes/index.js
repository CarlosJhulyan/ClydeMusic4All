const express = require('express');
const router = express.Router();
const sequelize = require('../conecction');
const { translate } = require('@vitalets/google-translate-api');

router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'ClydeMusic4All',
  });
});

router.post('/newUSer', async (req, res) => {
  const { username, password } = req.body;
  try {
    const dat = await sequelize.query('EXEC dbo.createNewUser \'' + username + '\',' + '\'' + password +  '\';');
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
