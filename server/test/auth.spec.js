const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('../index');
const knex = require('../db/db');
const tokens = require('./_tokens');

chai.should();
chai.use(chaiHttp);

let token;

const usersRoute = '/api/v1/users/';
const authRoute = '/api/v1/auth/';
const userId = 'user99';
const registerUser = {
  'user': {
    'id': userId,
    'username': 'user99',
    'password': 'tunapanda',
    'email': 'user99@wikonnect.com',
  }
};

const loginUserData = {
  'username': userId,
  'email': 'user99@wikonnect.com',
  'password': 'tunapanda',
  role: 'admin'
};

const badUserData = {
  'user': {
    'id': userId,
    'username': 'user99',
    'password': 'tunapanda'
  }
};

describe('AUTHENTICATION ROUTES', () => {

  before(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    return knex.seed.run();
  });
  describe('Auth routes tests: /api/v1/users/', () => {

    it('Should create user on POST requests', done => {
      chai
        .request(server)
        .post(usersRoute)
        .set('Content-Type', 'application/json')
        .send(registerUser)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.user.should.have.property('id');
          res.body.user.should.have.property('username');
          done();
        });
    });
    it('Should throw an ERROR for POST requests with bad/malformed data', done => {
      chai
        .request(server)
        .post(usersRoute)
        .send(badUserData)
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          res.should.have.status(400);
          expect(res.body.errors).to.deep.equal({ 'email': ['Email can\'t be blank'], 'phonenumber': ['Phonenumber can\'t be blank'] });
          expect(res.body.errors).to.have.property('email').with.lengthOf(1);
          expect(res.body.errors).to.have.property('phonenumber').with.lengthOf(1);
          done();
        });
    });

    it('Should throw an ERROR on POST data if user already exists', done => {
      chai
        .request(server)
        .post(usersRoute)
        .send(registerUser)
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          res.should.have.status(406);
          expect(res.body).to.deep.equal({ 'error': 'User exists' });
          done();
        });
    });
    it('Should login a valid user on POST and return token', done => {
      chai
        .request(server)
        .post(authRoute)
        .set('Content-Type', 'application/json')
        .send(loginUserData)
        .end((err, res) => {
          token = res.body.token;
          res.should.have.status(200);
          res.body.should.have.property('token');
          done();
        });
    });
    it('Should throw an ERROR on POST with invalid user data', done => {
      chai
        .request(server)
        .post(authRoute)
        .set('Content-Type', 'application/json')
        .send({ 'username': 'urlencoded', 'hash': 'urlencodedurl' })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
    it('Should throw an unauthorized error on GET ALL users requests', done => {
      chai
        .request(server)
        .get(usersRoute)
        .set('Content-Type', 'application/json')
        .set(tokens.headerBasicUser2)
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.have.property('error');
          done();
        });
    });
    it('Should get ONE user on GET requests using PARAMS', done => {
      chai
        .request(server)
        .get(usersRoute + userId)
        .set('Content-Type', 'application/json')
        .set(tokens.headerBasicUser2)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.user.should.have.property('id');
          res.body.user.should.have.property('username');
          res.body.user.should.have.property('email');
          done();
        });
    });

    it('Should get ONE user on GET requests using QUERY', done => {
      chai
        .request(server)
        .get(usersRoute + '?id=' + userId)
        .set('Content-Type', 'application/json')
        .set(tokens.headerBasicUser2)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.user[0].should.have.property('id');
          res.body.user[0].should.have.property('username');
          res.body.user[0].should.have.property('email');
          done();
        });
    });
  });
});
