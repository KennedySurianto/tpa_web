# Stage 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the app using a lightweight server
FROM nginx:alpine

# Copy the build output to Nginx’s html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: Copy a custom Nginx config (if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
