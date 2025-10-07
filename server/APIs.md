# API List

For all constraints on request parameters and request body content, always assume a 422 error in case one constraint is not satisfied.
For all access constraints, always assume a 401 error in case the access rule is not satisfied.
For all success scenarios, always assume a 200 status code for the API response.
Specific error scenarios will have their corresponding error code.

## Access APIs

### POST `musebook/api/session`

Performs login.

-   Request Parameters: None
-   Request Body Content:
    -   `username`: a string that must not be empty
    -   `password`: a string that must not be empty
-   Response Body Content: None
-   Access Constraints: None
-   Additional Constraints: None

### DELETE `musebook/api/session`

Performs logout.

-   Request Parameters: None
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### GET `musebook/api/session/pwd-reset/:email`

Requests a password reset link.

-   Request Parameters:
    -   `email`: a string that must include a `@` and a `.` after it
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints: None
-   Additional Constraints:
    -   return 401 if `email` does not exist in the database

### POST `musebook/api/session/pwd-reset`

Resets the password for a user.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `password`: a string that must not be empty
-   Response Body Content: None
-   Access Constraints: None
-   Additional Constraints:
    -   return 401 if `id` is not a valid user

## User management

### GET `musebook/api/user-confirm/:id/:salt`

Confirm a user's email

-   Request Parameters:
    -   `id`: a number
    -   `salt`: a number
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints: None
-   Additional Constraints:
    -   return 404 if `id` is not an unconfirmed email user
    -   return 409 if `salt` does not match the salt of `id`

### POST `musebook/api/user`

Register a new user.

-   Request Parameters: None
-   Request Body Content:
    -   `username`: a string (if empty, the email is used as username)
    -   `password`: a string that must not be empty
    -   `email`: a string that must include a `@` and a `.` after it
    -   `name`: a string that must not be empty
    -   `surname`: a string that must not be empty
    -   `language`: a string that must not be empty
-   Response Body Content: None
-   Access Constraints: None
-   Additional Constraints:
    -   returns 409 if the username is already taken

### DELETE `musebook/api/user`

Deletes a user.

-   Request Parameters: None
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### GET `musebook/api/user/search-song`

Get the list of the user song searches, sorted by search date descending.

-   Request Parameters: None
-   Request Body Content: None
-   Response Body Content:
    -   `int[] songs`: the list of song IDs
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### POST `musebook/api/user/search-song`

Notify that a song has been searched on a specific date.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `date`: a date which is not in the future
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not a valid song
    -   return 403 if the user does not have access to that song

### PATCH `musebook/api/user`

Change user data.

-   Request Parameters: None
-   Request Body Content:
    -   `username`: a string (if empty, the email is used as username)
    -   `password`: a string that must not be empty
    -   `name`: a string that must not be empty
    -   `surname`: a string that must not be empty
    -   `language`: a string that must not be empty
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 409 if `username` is already taken

## Library management

### GET `musebook/api/library`

Get the list of books that the logged user has in their library.

-   Request Parameters: None
-   Request Body Content: None
-   Response Body Content:
    -   `[ { id: number, isOwner: bool, isFavourite: bool }, ... ]`
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### POST `musebook/api/library`

Add a new (non-owned) book to the library

-   Request Parameters: None
-   Request Body Content:
    -   `book`: a number
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `book` does not exist
    -   return 401 if the user cannot read `book`

### DELETE `musebook/api/library`

Remove a (non-owned) book to the library

-   Request Parameters: None
-   Request Body Content:
    -   `book`: a number
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `book` does not exist
    -   return 401 if the user does not have `book` in their library

## Book management

### GET `musebook/api/book/list`

Get basic data about all books the user can access.

-   Request Parameters: None
-   Request Body Content: None
-   Response Body Content:
    -   `b[] books`: the list of books, where `b` is an object with:
    -   `int owner`: the ID of the user who owns the book
    -   `str ownerName`: the username of the user who owns the book
    -   `str title`: the title of the book
    -   `s[] songs`: the basic data of the songs inside the book, where `s` is an object with:
        -   `int id`: the song ID
        -   `str title`: the title of the song
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### GET `musebook/api/book/:id`

Get all data about a specific book.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content:
    -   `int owner`: the ID of the user who owns the book
    -   `str ownerName`: the username of the user who owns the book
    -   `bool canEdit`: if the user has write rights on the book
    -   `str title`: the title of the book
    -   `str description`: the description of the book
    -   `img cover`: the cover in front of the book
    -   `int[] songs`: the IDs of the songs inside the book
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing book
    -   return 403 if the user cannot read the book where the song is contained

### POST `musebook/api/books/favorite`

Add or remove the favorite flag from a book.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: number
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing book
    -   return 404 if `id` is not in the user's library

### DELETE `musebook/api/book/:id`

Delete a book.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing book
    -   return 404 if the user is not the owner of the book

### POST `musebook/api/book`

Create a new book.

-   Request Parameters: None
-   Request Body Content:
    -   `title`: a string that cannot be empty
    -   `description`: a string
    -   `cover`: an image
    -   `general_permission`: null, or a string that is either "R" or "W"
    -   `custom_permissions`: an array of objects that contain:
        -   `user`: a number
        -   `permission`: null, or a string that is either "R" or "W"
-   Response Body Content:
    -   `int id`: the Id of the new book
-   Access Constraints:
    -   user is logged
-   Additional Constraints:
    -   return 404 if any of the `custom_permissions.user` is not a valid user

### PATCH `musebook/api/book`

Edit data of a new book.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `title`: a string that cannot be empty
    -   `description`: a string
    -   `cover`: an image
    -   `general_permission`: null, or a string that is either "R" or "W"
-   Response Body Content:
    -   `int id`: the Id of the new book
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not a valid book
    -   return 401 if the user is not the owner of the book
    -   return 404 if any of the `custom_permissions.user` is not a valid user

### PATCH `musebook/api/book/custom-permissions`

Add a custom permission to a book.

-   Request Parameters: None
-   Request Body Content:
    -   `book`: a number
    -   `user`: a number
    -   `permission`: null, or a string that is either "R" or "W"
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `book` is not a valid book
    -   return 401 if the user is not the owner of the book
    -   return 404 if `user` is not a valid user

### PUSH `musebook/api/book/transfer`

Create a book transfer proposal.

-   Request Parameters: None
-   Request Body Content:
    -   `book`: a number
    -   `user`: a number
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `book` is not a valid book
    -   return 401 if the user is not the owner of the book
    -   return 404 if `user` is not a valid user

### DELETE `musebook/api/book/transfer/:id`

Refuse a book transfer proposal.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not a valid book
    -   return 401 if the user is not the proposed new owner of the book

### PATCH `musebook/api/book/transfer/:id`

Accept a book transfer proposal.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not a valid book
    -   return 401 if the user is not the proposed new owner of the book

## Songs management

### GET `musebook/api/song/:id`

Get data about a specific song.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content:
    -   `str title`: the title of the song
    -   `int[] variants`: the IDs of the variants of the song
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing song
    -   return 403 if the user cannot read the book where the song is contained

### PATCH `musebook/api/song`

Change title of a song.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `title` a string that must not be empty
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing song
    -   return 403 if the user cannot read the book where the song is contained

### DELETE `musebook/api/song`

Delete a song.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing song
    -   return 403 if the user cannot write the book where the song is contained

### POST `musebook/api/song`

Create a new song, with a variant called "default" and no annotations.

-   Request Parameters: None
-   Request Body Content:
    -   `title` a string that must not be empty
    -   `book`: a number
    -   `images`: a list of at least one number
-   Response Body Content:
    -   `int id`: the Id of the new song
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 409 if `id` is an existing song
    -   return 404 if `book` is not an existing book Id
    -   return 401 if any of the `id`s is not an existing image Ids
    -   return 403 if the user cannot write the book where the song is contained

### POST `musebook/api/song/duplicate`

Duplicate a song.

-   Request Parameters: None
-   Request Body Content:
    -   `song`: a number
    -   `book`: a number
-   Response Body Content:
    -   `int id`: the Id of the new song
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `song` is not a song
    -   return 404 if `book` is not a book
    -   return 401 if the user cannot read `song`
    -   return 401 if the user cannot write `book`

## Song variants management

### GET `musebook/api/variant/:id`

Get data about a specific song variant.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content:
    -   `str name`: the name of the variant
    -   `str notes`: eventual notes about the variant itself
    -   `d[] pages`: the (sorted) list of pages in the variant, where `d` is an object with:
        -   `int image`: the index of the base image
        -   `str annotations`: the svg annotations on top of the base image
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing variant
    -   return 403 if the user cannot read the book where the song is contained

### DELETE `musebook/api/variant/:id`

Delete a specific song variant.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing variant
    -   return 403 if the user cannot edit the book where the song is contained

### POST `musebook/api/variant`

Add a new variant for a song.

-   Request Parameters: None
-   Request Body Content:
    -   `song`: a number
    -   `name`: a string that must be non empty
    -   `notes`: a string
-   Response Body Content:
    -   `int id`: the id of the new variant
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `song` is not an existing song
    -   return 403 if the user cannot edit the book where the song is contained

### PATCH `musebook/api/variant`

Change data for a song variant.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `name`: a string that must be non empty
    -   `notes`: a string
    -   `pages`: a list that cannot be empty. Its items should be objects with:
        -   `image`: a number
        -   `annotations`: a string
-   Response Body Content:
    -   `int id`: the id of the new variant
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing variant
    -   return 404 if any of the `pages.image` is not an existing image
    -   return 403 if the user cannot edit the book where the song is contained

### POST `musebook/api/variant/open`

Notify that a specific variant was opened on a specific day.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `date`: a date that must not be in the future
-   Response Body Content: None
-   Access Constraints:
    -   user must be logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing variant
    -   return 403 if the user cannot view the book where the song is contained

## Song images management

### GET `musebook/api/song-image/:id`

Get a specific base image for a song page.

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content:
    -   `img image`: the data of the image
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not an existing song image
    -   return 403 if the user cannot read the book where the song is contained

### POST `musebook/api/song-image`

Upload a new image for a song page.

-   Request Parameters: None
-   Request Body Content:
    -   `image`: an image
-   Response Body Content:
    -   `int id`: the Id of the new image
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

## Playlist management

### GET `musebook/api/playlist/`

Get all the user's playlists.

-   Request Parameters:
-   Request Body Content: None
-   Response Body Content:
    -   `p[] playlists`: the playlists, where `p` contains:
        -   `int id`: the playlist Id
        -   `str name`: the name of the playlist
        -   `date date`: the date of the event
        -   `s[] items`: the labels/songs of the playlist, where `s` contains:
            -   `str label`: the label of the item
            -   `int song`: none, or the song id
            -   `str color`: the color of the item
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### DELETE `musebook/api/playlist/:id`

Delete a playlist

-   Request Parameters:
    -   `id`: a number
-   Request Body Content: None
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not a playlist
    -   return 401 if `id` is not a playlist owned by the user

### POST `musebook/api/playlist/`

Create a new playlists.

-   Request Parameters: None
-   Request Body Content:
    -   `name`: a string that cannot be empty
    -   `date`: a date
    -   `items`: an array of objects that contain:
        -   `label`: a string that cannot be empty
        -   `song`: a number
        -   `color`: a string
-   Response Body Content:
    -   `int id`: the Id of the new playlist
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if any of `items.song` is not a song
    -   return 401 if any of `items.song` is not a song that the user can read

### PATCH `musebook/api/playlist/`

Create a new playlists.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `name`: a string that cannot be empty
    -   `date`: a date
    -   `items`: an array of objects that contain:
        -   `label`: a string that cannot be empty
        -   `song`: a number
        -   `color`: a string
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if any of `items.song` is not a song
    -   return 401 if any of `items.song` is not a song that the user can read
    -   return 404 if `id` is not a valid playlist
    -   return 401 if `id` is not a playlist owned by the user

### POST `musebook/api/playlist/duplicate`

Create a new playlist for a user, as the copy of another user's playlist.

-   Request Parameters: None
-   Request Body Content:
    -   `playlist`: a number
    -   `owner`: a number
-   Response Body Content:
    -   `int id`: the Id of the new playlist
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `playlist` does not exist
    -   return 401 if the owner of `playlist` is not `owner`

## Playlist template management

### GET `musebook/api/template`

Get all the user's playlist templates.

-   Request Parameters: None
-   Request Body Content: None
-   Response Body Content:
    -   `t[] templates`: the list of templates, where `t` contains:
        -   `int id`: the Id of the template
        -   `str name`: the name of the template
        -   `i[] items`: the labels of the playlist, where `i` contains:
            -   `str label`: the label of the item
            -   `str color`: the color of the item
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### POST `musebook/api/template`

Create a new playlist template.

-   Request Parameters: None
-   Request Body Content:
    -   `name`: a string that cannot be empty
    -   `items`: a list of objects that contain:
        -   `label`: a string that cannot be empty
        -   `color`: a string
-   Response Body Content:
    -   `int id`: the Id of the template
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None

### PATCH `musebook/api/template`

Edit a playlist template.

-   Request Parameters: None
-   Request Body Content:
    -   `id`: a number
    -   `name`: a string that cannot be empty
    -   `items`: a list of objects that contain:
        -   `label`: a string that cannot be empty
        -   `color`: a string
-   Response Body Content: None
-   Access Constraints:
    -   user is logged in
-   Additional Constraints:
    -   return 404 if `id` is not a valid template
    -   return 401 if the user is not the owner of `id`

## Synchronization

### GET `musebook/api/updates`

Returns the list of APIs to call to get the modifications since the last update.

-   Request Parameters: None
-   Request Body Content: None
-   Response Body Content:
    -   `str[] apis`: the list of APIs to call
-   Access Constraints:
    -   user is logged in
-   Additional Constraints: None
