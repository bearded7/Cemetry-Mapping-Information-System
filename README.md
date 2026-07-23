# CMIS
Cemetery Mapping And Information System

# To run it locally:

unzip cemetery-registry.zip && cd cemetery-system
npm install
cp .env.example .env   # set SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed
npm run dev
