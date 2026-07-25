# Cemetery Mapping Information System (CMIS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Render](https://img.shields.io/badge/Render-Deploy-success)](https://render.com)

A comprehensive web application for cemetery mapping and grave location management. Easily locate graves of loved ones within cemeteries using interactive maps.

## 🌟 Features

- 🗺️ **Interactive Map** - Visualize cemeteries and graves using Leaflet/OpenStreetMap
- 🔍 **Smart Search** - Find graves by name, date, location, or plot number
- 📸 **Photo Upload** - Preserve memories with grave photos and epitaphs
- 🏛️ **Cemetery Management** - Add, edit, and organize cemetery information
- 📊 **Dashboard** - View statistics and manage records
- 🔐 **User Authentication** - Secure login and role-based access
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌍 **Geospatial Support** - PostGIS integration for location-based queries

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ with PostGIS
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/bearded7/Cemetry-Mapping-Information-System.git
cd Cemetry-Mapping-Information-System

# Run setup script
./scripts/setup.sh

# Or manually:
npm install
cp .env.example .env
# Update .env with your database credentials
npm run migrate
npm run seed
npm start