import * as env from "../env";
import * as P from "bluebird";
import * as serverlessMysql from "serverless-mysql";
import "reflect-metadata";
import { injectable } from "inversify";
import { ICinemaRepository } from "../inversify/interfaces";
import { fetch } from "../lib/circuitBreaker";
import { cinemaDeserializer } from "../serializers/cinemasSerializer";

const mysql = serverlessMysql({
  config: {
    host     : env.get("DATABASE_HOST"),
    database : env.get("DATABASE"),
    user     : env.get("DATABASE_USER"),
    password : env.get("DATABASE_PASSWORD"),
    dateStrings: true
  }
});

const host = env.get("MOVIES_SERVICE_HOST");

@injectable()
export class CinemaRepository implements ICinemaRepository {
  public async getCinemasByCity(id: string): P<any> {
    const results = await mysql.query<[]>(
      "SELECT id, name FROM cinema WHERE city_id = ?",
      [id]
    );

    await mysql.end();

    return results;
  }

  public async getCinemaById(id: string): P<any> {
    const cinemaPremieres = await mysql.query<any>(
      `SELECT cinema.id, name, movie_id
         FROM cinema_catalog.cinema
   INNER JOIN cinema_catalog.cinemaPremiere
           ON cinema.id = cinemaPremiere.cinema_id
        WHERE cinema.id = ?`,
      [id]
    );
    await mysql.end();

    const premiereMovieIds = cinemaPremieres.map((premiere) => premiere.movie_id);

    // make api requests parallel
    const parallelRequests = premiereMovieIds.map((movieId) => {
      const url = host + "/api/movies/" + movieId;
      return fetch(url);
    });

    // deserialize response
    const movies = P.map(parallelRequests, async (movie) => {
      const deserializedMovie = await cinemaDeserializer.deserialize(movie);
      return deserializedMovie[0];
    });

    const cinema = {
      id: cinemaPremieres[0].id,
      name: cinemaPremieres[0].name,
      movies: await movies
    };

    // return object
    return P.props(cinema);
  }

  public async getCinemaScheduleByMovie(cinemaId: string, movieId: string): P<any> {
    const cinema = await mysql.query(
      "SELECT id, name FROM cinema WHERE id = ?",
      [cinemaId]
    );
    await mysql.end();

    const rooms = await mysql.query<any>(
      `SELECT cinemaRoom.id, name, capacity, format, time, price
         FROM cinemaRoom
   INNER JOIN schedule
           ON cinemaRoom.id = schedule.cinemaRoom_id
        WHERE cinemaRoom.cinema_id = ?`,
      [cinemaId]
    );
    await mysql.end();

    // transform object array to nested object to reduce data redandancy
    const nestedRooms = rooms.reduce((result, room) => {
      const a = result.find(({id}) => id === room.id);
      const { time, price } = room;
      if (a) {
        a.schedules.push({time, price});
      } else {
        result.push({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          schedules: [{time, price}]
        });
      }
      return result;
    }, []);

    const movie = await fetch(host + "/api/movies/" + movieId);
    const deserializedMovie = await cinemaDeserializer.deserialize(movie);

    const cinemaSchedules = Object.assign({}, cinema[0], {
      movie: deserializedMovie,
      rooms: nestedRooms
    });

    // return array of objects
    return P.all([cinemaSchedules]);
  }
}
