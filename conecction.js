const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('Chinook', 'Jhulyan', 'CJdeveloper%989%', {
    dialect: 'mssql',
    port: 1433,
    pool: {
        max: 5,
        min: 0,
        idle: 10000,
    },
    dialectOptions: {
        options: {
            encrypt: true,
        },
    },
});

module.exports = sequelize;
