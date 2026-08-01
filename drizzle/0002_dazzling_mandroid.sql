ALTER TABLE "game" DROP CONSTRAINT "game_points_iff_played";--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_points_iff_played" CHECK (("game"."points_a" is null) = ("game"."points_b" is null)
        and (
          ("game"."status" = 'played' and "game"."points_a" is not null)
          or "game"."status" = 'cancelled'
          or ("game"."status" = 'proposed' and "game"."points_a" is null)
        ));--> statement-breakpoint
CREATE OR REPLACE VIEW player_stats AS
SELECT
    p.player_id,
    p.league_id,
    count(g.game_id) FILTER (
      WHERE b.committed AND g.status = 'played'
    ) AS games_played,
    count(g.game_id) FILTER (
      WHERE b.committed
        AND g.status = 'played'
        AND (
          (gp.team = 'a' AND g.points_a > g.points_b)
          OR (gp.team = 'b' AND g.points_b > g.points_a)
        )
    ) AS games_won,
    count(g.game_id) FILTER (
      WHERE b.committed
        AND g.status = 'played'
        AND (
          (gp.team = 'a' AND g.points_a < g.points_b)
          OR (gp.team = 'b' AND g.points_b < g.points_a)
        )
    ) AS games_lost,
    (
      SELECT count(*)
      FROM block_pause bp
      INNER JOIN game_block paused_block
        ON paused_block.block_id = bp.block_id
       AND paused_block.committed
      WHERE bp.player_id = p.player_id
        AND bp.league_id = p.league_id
        AND EXISTS (
          SELECT 1
          FROM game played_pause_game
          WHERE played_pause_game.block_id = bp.block_id
            AND played_pause_game.status = 'played'
        )
    ) AS games_paused
FROM player p
LEFT JOIN game_participation gp ON gp.player_id = p.player_id
LEFT JOIN game g ON g.game_id = gp.game_id
LEFT JOIN game_block b ON b.block_id = g.block_id
GROUP BY p.player_id, p.league_id;
