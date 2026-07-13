# Roadmap

## Revival
- Recover the original App Engine datastore export if one exists.
- Recover the missing `templates/` directory and favicon/image handlers if one exists.
- Recover `static/toolbook2.txt` through `static/toolbook18.txt`, the saved Wikipedia Book Creator corpus used by the scanner.
- Compare the local HTML replica against archived screenshots or a deployed copy if any can be found.

## Modernization Ideas For Later
- Port the original Python 2 `webapp2` handlers to a tiny Flask or FastAPI app after the faithful local replica is validated.
- Store extracted object-use records in SQLite for repeatable local search.
- Add a one-command importer for Wikipedia book exports.

## Preserve
- Keep the old App Engine `main.py` as the historical source of truth until a separate modernization pass is scheduled.
