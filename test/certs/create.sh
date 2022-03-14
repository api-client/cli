# server
openssl req -x509 -newkey rsa:4096 -keyout server_key.key -out server_cert.crt -nodes -days 36525 -subj "/C=US/ST=California/L=San\ Francisco/O=MuleSoft\ Inc/OU=ARC/CN=localhost/O=OAuth\ Test\ Server"
