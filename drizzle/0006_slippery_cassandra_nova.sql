ALTER TABLE "player" ADD CONSTRAINT "player_identity_state" CHECK ((
        not "player"."marked_as_deleted"
        and "player"."anonymized_key" is null
        and btrim("player"."first_name") <> ''
      ) or (
        "player"."marked_as_deleted"
        and "player"."anonymized_key" is not null
        and "player"."first_name" = ''
        and "player"."last_name" = ''
      ));