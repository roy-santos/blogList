const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  },
  {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10,
  },
  {
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
  },
  {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
  }
]

const validBlog = {
  title: 'a new blog',
  author: 'John Bell John',
  url: 'http://www.anewblogpostwebsite.com',
  likes: 1
}

const noLikesBlog = {
  title: 'a blog with no likes',
  author: 'Nott Likely',
  url: 'http://www.anewblogpostwebsite.com',
}

const missingTitleBlog = {
  author: 'John Bell John',
  url: 'http://www.missingtitle.com',
  likes: 1
}

const missingUrlBlog = {
  title: 'Blog with no URL',
  author: 'John Bell John',
  likes: 1
}

const missingTitleUrlBlog = {
  author: 'John Bell John',
  likes: 1
}

const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon', author: 'Author', url: 'http://fakeurl.com', likes: 5 })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs,
  validBlog,
  noLikesBlog,
  missingTitleBlog,
  missingUrlBlog,
  missingTitleUrlBlog,
  nonExistingId,
  blogsInDb,
  usersInDb,
}