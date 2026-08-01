UPDATE "player"
SET
  "first_name" = '',
  "last_name" = '',
  "anonymized_key" = 'anon_' || CASE
    WHEN "player_id" LIKE 'player\_%' ESCAPE '\'
      THEN substring("player_id" FROM 8)
    ELSE "player_id"
  END
WHERE "marked_as_deleted";
