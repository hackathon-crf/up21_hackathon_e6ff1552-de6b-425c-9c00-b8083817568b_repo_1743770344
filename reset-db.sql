-- Drop all tables in the correct order to respect foreign key constraints
DROP TABLE IF EXISTS game_answer;
DROP TABLE IF EXISTS game_round;
DROP TABLE IF EXISTS game_player;
DROP TABLE IF EXISTS game_lobby;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS chat_message;
DROP TABLE IF EXISTS chat_session;
DROP TABLE IF EXISTS rag_document;
DROP TABLE IF EXISTS rag_collection;
DROP TABLE IF EXISTS study_stat;
DROP TABLE IF EXISTS flashcard;
DROP TABLE IF EXISTS user_preference;
DROP TABLE IF EXISTS "user";

-- Also drop any tables with the old prefix
DROP TABLE IF EXISTS "cr-hackathon-secours_game_answer";
DROP TABLE IF EXISTS "cr-hackathon-secours_game_round";
DROP TABLE IF EXISTS "cr-hackathon-secours_game_player";
DROP TABLE IF EXISTS "cr-hackathon-secours_game_lobby";
DROP TABLE IF EXISTS "cr-hackathon-secours_feedback";
DROP TABLE IF EXISTS "cr-hackathon-secours_chat_message";
DROP TABLE IF EXISTS "cr-hackathon-secours_chat_session";
DROP TABLE IF EXISTS "cr-hackathon-secours_rag_document";
DROP TABLE IF EXISTS "cr-hackathon-secours_rag_collection";
DROP TABLE IF EXISTS "cr-hackathon-secours_study_stat";
DROP TABLE IF EXISTS "cr-hackathon-secours_flashcard";
DROP TABLE IF EXISTS "cr-hackathon-secours_user_preference";
DROP TABLE IF EXISTS "cr-hackathon-secours_user";

-- Reset sequences if needed
ALTER SEQUENCE IF EXISTS game_answer_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS game_round_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS game_player_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS game_lobby_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS feedback_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rag_document_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rag_collection_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS study_stat_id_seq RESTART WITH 1;