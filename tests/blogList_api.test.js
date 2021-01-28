const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')

const User = require('../models/user')
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObjects = new Blog(blog)
    await blogObjects.save()
  }


})

describe('when there are initially some blogs saved', () => {
  test('all blogs are returned and returned as JSON', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const titles = response.body.map(r => r.title)

    expect(titles).toContain(
      helper.initialBlogs[0].title
    )
  })

  test('blogs have "id" property', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body[0].id).toBeDefined()
  })
})

describe('viewing a specific blog', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

    expect(resultBlog.body).toEqual(processedBlogToView)
  })

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonExistingId = await helper.nonExistingId()

    console.log(validNonExistingId)

    await api
      .get(`/api/blogs/${validNonExistingId}`)
      .expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400)
  })
})

describe('addition of a new blog', () => {
  let token =  null

  beforeAll(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'jobin12', passwordHash })

    await user.save()

    // Login
    const response = await api
      .post('/api/login')
      .send({ username: 'jobin12', password: 'sekret' })

    token = response.body.token
  })

  test('succeeds with valid data', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(helper.validBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    expect(blogsAtEnd).toEqual(
      expect.arrayContaining([
        expect.objectContaining(helper.validBlog)
      ])
    )
  })

  test('fails with missing token', async () => {
    await api
      .post('/api/blogs')
      .send(helper.validBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length )
  })

  test('fails with invalid token', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', 'bearer invalidToken12345')
      .send(helper.validBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length )
  })

  test('a blog with missing likes property defaults to 0', async () => {
    const response = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(helper.noLikesBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(response.body.likes).toEqual(0)
  })

  test('responds with status 400 if blog is missing title and/or url', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(helper.missingTitleBlog)
      .expect(400)

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(helper.missingUrlBlog)
      .expect(400)

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(helper.missingTitleUrlBlog)
      .expect(400)
  })
})

describe('deletion of a blog', () => {
  let token =  null

  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'jobin12', passwordHash })

    await user.save()

    // Login and get token
    const response = await api
      .post('/api/login')
      .send({ username: 'jobin12', password: 'sekret' })

    token = response.body.token

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(helper.validBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  })

  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await Blog.find({}).populate('user')
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await Blog.find({}).populate('user')

    expect(blogsAtStart).toHaveLength(1)
    expect(blogsAtEnd).toHaveLength(
      blogsAtStart.length - 1
    )

    const titles = blogsAtEnd.map(r => r.title)

    expect(titles).not.toContain(blogToDelete.title)
  })

  test('fails with status 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .delete(`/api/blogs/${invalidId}`)
      .set('Authorization', `bearer ${token}`)
      .expect(400)
  })
})

describe('updating a blog', () => {
  test('succeeds with status code 200 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    const updatedBlog = { ...blogToUpdate, likes: blogToUpdate.likes + 1 }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd[0].likes).toEqual(blogToUpdate.likes + 1)
  })

  test('fails with status 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    const updateToSend = {
      likes: 99,
      title: 'Test3',
      author: 'Marcus Grenier II',
      url: 'http://www.mediumblog.com/articles/psbpII'
    }
    await api
      .put(`/api/blogs/${invalidId}`)
      .send(updateToSend)
      .expect(400)

  })
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passowrdHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passowrdHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukai',
      name: 'Matti Luukkainen',
      password: 'salainen'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const username = usersAtEnd.map(u => u.username)
    expect(username).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password under 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const invalidPassUser = {
      username: 'invalidPassUser',
      name: 'Invalid',
      password: '12',
    }

    const result = await api
      .post('/api/users')
      .send(invalidPassUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password too short')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const invalidPassUser = {
      username: 'InvalidUser',
      name: 'Invalid',
    }

    const result = await api
      .post('/api/users')
      .send(invalidPassUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password too short')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username is under 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const InvalidUser = {
      username: '11',
      name: 'Invalid',
      password: 'InvalidUser'
    }

    const result = await api
      .post('/api/users')
      .send(InvalidUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('User validation failed')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const InvalidUser = {
      name: 'Invalid',
      password: 'InvalidUser'
    }

    const result = await api
      .post('/api/users')
      .send(InvalidUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})