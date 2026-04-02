import urllib.request, json

BASE = 'http://127.0.0.1:8000'

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={'Content-Type':'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get(path, token=None):
    headers = {'Content-Type':'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(BASE + path, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

print('=== REGISTER ===')
status, body = post('/api/auth/register', {'name':'Ana','email':'ana@test.com','password':'secure123'})
print(f'  Status: {status}')

if status not in (200, 201):
    print(f'  FALLO: {body}')
    exit(1)

token = body['token']
user  = body['user']
print(f'  Token (primeros 40): {token[:40]}...')
print(f'  Usuario: {user["name"]} ({user["email"]})')

print()
print('=== LOGIN ===')
s2, b2 = post('/api/auth/login', {'email':'ana@test.com','password':'secure123'})
print(f'  Status: {s2}')
print(f'  Token OK: {b2.get("token","")[:20] == token[:20]}')

print()
print('=== GET PROFILE (con token) ===')
s3, b3 = get('/api/profile/', token)
print(f'  Status: {s3}')
if s3 == 200:
    print(f'  User: {b3["user"]["name"]}')
    print(f'  Budget: {b3["preferences"]["max_budget_clp"]}')

print()
print('=== GET PROFILE (sin token — debe dar 403) ===')
s4, b4 = get('/api/profile/')
print(f'  Status: {s4}')

print()
print('=== GET HISTORY (con token — debe estar vacio) ===')
s5, b5 = get('/api/recipes/history', token)
print(f'  Status: {s5}')
if s5 == 200:
    print(f'  Items en historial: {b5["total"]}')
