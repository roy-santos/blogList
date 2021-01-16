const dummy = (blogs) => {
  blogs
  return 1
}

const totalLikes = (blogs) => {
  let count = 0

  blogs.forEach(blog => {
    count += blog.likes
  })

  return count
}

const favoriteBlog = (blogs) => {
  const likes = blogs.map(blog => blog.likes)

  const index = likes.indexOf(Math.max(...likes))

  const favoriteBlog = {
    title: blogs[index].title,
    author: blogs[index].author,
    likes: blogs[index].likes
  }

  return favoriteBlog
}

const mostBlogs = (blogs) => {
  let authorsAndBlogs = new Map()

  blogs.forEach(blog => {
    if (authorsAndBlogs.has(blog.author)) {
      authorsAndBlogs.set(blog.author, authorsAndBlogs.get(blog.author) + 1)
    } else {
      authorsAndBlogs.set(blog.author, 1)
    }
  })

  const arrayMap = [...authorsAndBlogs.entries()]

  const maxBlogs = Math.max(...authorsAndBlogs.values())

  let result = {}

  arrayMap.forEach(entry => {
    if (entry[1] === maxBlogs) {
      result = {
        author: entry[0],
        blogs: entry[1]
      }
    }
  })

  return result
}

const mostLikes = (blogs) => {
  let authorsAndLikes = new Map()

  blogs.forEach(blog => {
    if (authorsAndLikes.has(blog.author)) {
      authorsAndLikes.set(blog.author, authorsAndLikes.get(blog.author) + blog.likes)
    } else {
      authorsAndLikes.set(blog.author, blog.likes)
    }
  })

  const arrayMap = [...authorsAndLikes.entries()]

  const maxLikes = Math.max(...authorsAndLikes.values())

  let result = {}

  arrayMap.forEach(entry => {
    if (entry[1] === maxLikes) {
      result = {
        author: entry[0],
        likes: entry[1]
      }
    }
  })

  return result
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}