const { sequelize } = require('./models');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('SUCCESS: Database authenticated successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Unable to connect to the database:', err.message);
    process.exit(1);
  }
}

test();
