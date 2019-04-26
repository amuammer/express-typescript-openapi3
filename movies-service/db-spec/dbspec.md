# posible collections for the cinemas db

- movies

```uml
@startuml erd
title movie
left to right direction

frame "movie" {
  entity "movie" {
      + id:string [PK]
      ==
      title:string
      runtime:innt
      format:string
      plot:string
      released_at:datetime
  }
}

@enduml
```

## To see ERD in github

- install chrome extension [Pegmatite](https://chrome.google.com/webstore/detail/pegmatite/jegkfbnfbfnohncpcfcimepibmhlkldo)