# taskalloc-backend
First get MySQL and Redis running at localhost:3306 and localhost:6379 respectively.
To run this backend, type the following commands at the terminal
```
$ npm i
$ npx prisma db push
$ npx prisma db seed
$ npm start
```
One can use `curl` to test this backend
```
$ curl -v -X POST -d "ldap=20d170019&passwd=20d170019" http://localhost:3000/api/v1/login
*   Trying 127.0.0.1:3000...
* Connected to localhost (127.0.0.1) port 3000 (#0)
> POST /api/v1/login HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.79.1
> Accept: */*
> Content-Length: 31
> Content-Type: application/x-www-form-urlencoded
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: application/json; charset=utf-8
< Content-Length: 30
< ETag: W/"1e-UbWuP9+r/vPcMKHjBTTm4WaBu1E"
< Set-Cookie: connect.sid=s%3AWKg2Ri7SCWuTFnSaiuFyKwpsEMrp1Wi2.y4%2BnGsATk9rN7bslVjIAA8OpPR8%2BhsVrVfZS6n0BPrQ; Path=/; Expires=Mon, 07 Mar 2022 20:41:31 GMT; HttpOnly
< Date: Mon, 07 Mar 2022 20:39:31 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< 
* Connection #0 to host localhost left intact
{"success":true,"privlevel":0}
```
