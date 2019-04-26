import "reflect-metadata";
import * as P from "bluebird";
import { Container, injectable } from "inversify";
import { TYPES } from "../src/inversify/types";
import { CinemaRepository } from "../src/repositories/cinemasRepository";
import { IMovieRepository } from "../src/inversify/interfaces";

@injectable()
class DummyMovieRepository implements IMovieRepository {

  private testMovies = [{
    id: "3",
    title: "xXx: Reactivado",
    runtime: 100,
    format: "IMAX",
    plot: "Lorem ipsum dolor sit amet",
    released_at: "2018-12-01T00:00:00Z"
  }, {
    id: "4",
    title: "Resident Evil: Capitulo Final",
    runtime: 100,
    format: "IMAX",
    plot: "Lorem ipsum dolor sit amet",
    released_at: "2018-12-01T00:00:00Z"
  }, {
    id: "1",
    title: "Assasins Creed",
    runtime: 100,
    format: "IMAX",
    plot: "Lorem ipsum dolor sit amet",
    released_at: "2018-12-01T00:00:00Z"
  }];

  public async getAllMovies(): P<any[]> {
    return P.all(this.testMovies);
  }

  public async getMoviePremieres(): P<any[]> {
    return P.all(this.testMovies);
  }

  public async getMovieById(id: string): P<any> {
    return P.all(this.testMovies);
  }
}

const testContainer = new Container();
testContainer.bind<CinemaRepository>(TYPES.ICinemaRepository).to(DummyMovieRepository);

export { testContainer };