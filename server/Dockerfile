# Use the Node.js LTS image as a base
FROM node:lts

# Copy app source
COPY . /src

# Set working directory to /src
WORKDIR /src

# Install dotenv package
RUN npm install

# Expose port to outside world
EXPOSE 6060

# Start command as per the package.json file
CMD ["node", "index.js"]