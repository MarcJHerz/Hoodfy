const fs = require('fs');
const path = require('path');

const initDirectories = () => {
  const directories = [
    '../uploads/posts',
    '../uploads/posts/thumbnails',
    '../uploads/communities',
    '../uploads/profiles'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

module.exports = initDirectories; 