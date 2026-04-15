-- =========================================
-- Sakura Cinema Database Schema 
-- =========================================

-- DROP TABLES (safe reset)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
   
    CONSTRAINT email_format CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
    )
);

-- MOVIES
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    genre VARCHAR(100),
    rating VARCHAR(10),
    poster_url TEXT,
    release_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT duration_positive CHECK (duration_minutes > 0)
);

-- SHOWS 
-- Each movie can have multiple show times
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    show_time TIMESTAMP NOT NULL,
    price INTEGER NOT NULL,
    screen_name VARCHAR(50),

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT price_positive CHECK (price > 0)
);

-- SEATS 
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,

    seat_number INTEGER NOT NULL,
    row_label VARCHAR(2),

    is_booked BOOLEAN DEFAULT FALSE,

    user_id INTEGER REFERENCES users(id),
    booked_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT show_seat_unique UNIQUE (show_id, seat_number)
);

-- BOOKINGS 
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,

    status VARCHAR(20) DEFAULT 'confirmed',

    booking_date TIMESTAMP DEFAULT NOW(),

    CONSTRAINT status_valid CHECK (
        status IN ('confirmed', 'cancelled', 'completed')
    )
);

-- SAMPLE MOVIES (5 INSERTS)
INSERT INTO movies (title, description, duration_minutes, genre, rating, release_date, is_active)
VALUES
('Dhurandhar The Revenge', 'An epic tale of revenge and redemption.', 145, 'Action', 'PG-13', '2026-01-15', TRUE),

('Sakura Dreams', 'Love blooming under cherry blossoms in Tokyo.', 120, 'Romance', 'PG', '2026-02-14', TRUE),

('Shadow Shinobi', 'Ancient warriors protect modern Japan.', 135, 'Action/Fantasy', 'PG-13', '2026-03-01', TRUE),

('Ramen Quest', 'Journey to find perfect ramen across Japan.', 110, 'Drama/Comedy', 'PG', '2026-02-28', TRUE),

('Neon Samurai 2077', 'Cyberpunk samurai vs corporations.', 155, 'Sci-Fi/Action', 'R', '2026-04-10', TRUE);

-- SAMPLE SHOWS 
INSERT INTO shows (movie_id, show_time, price, screen_name)
SELECT id, NOW() + (INTERVAL '1 day' * id), 250 + (id * 50), 'Screen-1'
FROM movies;

-- SEATS GENERATION (40 seats per show)
DO $$
DECLARE
    show_record RECORD;
    seat_num INT;
    row_labels TEXT[] := ARRAY['A','B','C','D','E'];
    r INT;
BEGIN
    FOR show_record IN SELECT id FROM shows LOOP
        seat_num := 1;

        FOR r IN 1..5 LOOP
            FOR i IN 1..8 LOOP
                INSERT INTO seats (show_id, seat_number, row_label, is_booked)
                VALUES (show_record.id, seat_num, row_labels[r], FALSE);

                seat_num := seat_num + 1;
            END LOOP;
        END LOOP;

    END LOOP;
END $$;

-- INDEXES 
CREATE INDEX idx_movies_active ON movies(is_active);

CREATE INDEX idx_shows_movie_id ON shows(movie_id);

CREATE INDEX idx_seats_show_id ON seats(show_id);
CREATE INDEX idx_seats_booked ON seats(is_booked);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_show_id ON bookings(show_id);
