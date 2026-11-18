"""
SECURITY CHECK - we attack our own API and show which attacks are blocked.

Run (from the webdevdj folder):      python security_check.py
It uses a temporary in-memory database, your real data is not touched.

  PASS = the attack was blocked          FAIL = the attack worked (a hole!)
"""
import os,sys,django,time
os.environ["DJANGO_SETTINGS_MODULE"]="webdevdj.settings"
django.setup()
from django.conf import settings
from django.test.utils import setup_test_environment
from django.test.runner import DiscoverRunner
setup_test_environment()
from django.core.cache import cache
r=DiscoverRunner(verbosity=0); old=r.setup_databases()
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from api.models import Car, CarBrand, Message
cache.clear()
PASSED, FAILED = [], []
def show(name, vuln, detail=""):
    (FAILED if vuln else PASSED).append(name)
    print(f"  {'FAIL  ATTACK WORKS:' if vuln else 'PASS  blocked:'} {name}" + (f"  ({detail})" if detail else ""))
def cl(u=None, **extra):
    x=APIClient(**extra)
    if u: x.force_authenticate(u)
    return x
STRONG="Zx9!qwerty-77"
alice=User.objects.create_user("alice",email="a@a.kz",password=STRONG); bob=User.objects.create_user("bob",email="b@b.kz",password=STRONG)
boss=User.objects.create_user("boss",email="boss@a.kz",password=STRONG,is_staff=True)
br=CarBrand.objects.create(name="TestBrand")
base={"title":"BMW X5","brand":br.id,"price":36e6,"year":2019,"mileage":46126,"description":"Хорошее состояние, один хозяин"}
cid=cl(alice).post("/api/cars-cbv/",base,format="json").json()["id"]
Message.objects.create(sender=bob,receiver=alice,car=Car.objects.get(pk=cid),text="secret deal at 5pm")

print("== 1. ACCESS CONTROL (can another user touch alice's data?)")
show("bob edits alice's ad", cl(bob).put(f"/api/cars-cbv/{cid}/",base,format="json").status_code==200)
show("bob deletes alice's ad", cl(bob).delete(f"/api/cars-cbv/{cid}/").status_code==204)
carol=User.objects.create_user("carol",password=STRONG)
leak=cl(carol).get(f"/api/conversations/{cid}/{alice.id}/").json()
show("stranger reads someone else's conversation", len(leak["messages"])>0)
show("stranger sees messages in /api/messages/", len(cl(carol).get("/api/messages/").json())>0)
show("normal user opens admin API", cl(bob).get("/api/manage/users/").status_code==200)
show("guest opens admin API", cl().get("/api/manage/users/").status_code==200)
show("guest reads profile", cl().get("/api/profile/").status_code==200)

print("== 2. MASS ASSIGNMENT (sending extra fields)")
res=cl(bob).post("/api/cars-cbv/",{**base,"owner":alice.id,"views_count":99999},format="json").json()
show("create ad as bob but set owner=alice / views_count", res.get("owner")!=bob.id or res.get("views_count")==99999, f"owner={res.get('owner')} views={res.get('views_count')}")
cl(bob).put(f"/api/profile/",{"is_staff":True,"phone":"+7 777 123 45 67"},format="json")
show("bob makes himself admin via profile", User.objects.get(pk=bob.pk).is_staff)
APIClient().post("/api/register/",{"username":"evil","email":"e@e.kz","password":STRONG,"is_staff":True,"is_superuser":True},format="json")
u=User.objects.filter(username="evil").first()
show("register with is_staff / is_superuser", bool(u and (u.is_staff or u.is_superuser)))
m=cl(bob).post("/api/messages/",{"receiver":alice.id,"car":cid,"text":"hi","sender":alice.id,"is_read":True},format="json").json()
show("message with fake sender / is_read", m.get("sender")!=bob.id or m.get("is_read") is True)

print("== 3. TOKENS")
old_key=settings.SECRET_KEY
show("secret key is the one published on GitHub", old_key.startswith("django-insecure-^%12cl"))
import jwt, datetime as _dt
LEAKED="django-insecure-^%12cl%szm(sbwk!(u$zc*2mfm@@-roxm_mv&^)yhce3$ih&sa"
forged=jwt.encode({"token_type":"access","exp":int(time.time())+3600,"iat":int(time.time()),"jti":"x"*32,"user_id":str(boss.id)},LEAKED,algorithm="HS256")
show("admin token forged with the LEAKED GitHub key accepted", APIClient(HTTP_AUTHORIZATION=f"Bearer {forged}").get("/api/manage/users/").status_code==200, "attacker becomes admin")
alice.is_active=False; alice.save()
show("token of a blocked user still works", APIClient(HTTP_AUTHORIZATION=f"Bearer {str(AccessToken.for_user(alice))}").get("/api/profile/").status_code==200)
alice.is_active=True; alice.save()
good=APIClient().post("/api/login/",{"username":"bob","password":STRONG},format="json").json()
ok=APIClient().post("/api/logout/",{"refresh":good["refresh"]},format="json").status_code
after=APIClient().post("/api/refresh/",{"refresh":good["refresh"]},format="json").status_code
show("refresh token still valid after logout", after==200, f"logout={ok}, refresh after logout={after}")

print("== 4. BRUTE FORCE / ABUSE (no lock-out?)")
cache.clear()
codes=[APIClient().post("/api/login/",{"username":"bob","password":f"wrong{i}"},format="json").status_code for i in range(25)]
show("25 wrong passwords in a row", 429 not in codes, f"statuses: {sorted(set(codes))}")
cache.clear()
codes=[APIClient().post("/api/register/",{"username":f"spam{i}","email":f"s{i}@s.kz","password":STRONG},format="json").status_code for i in range(25)]
show("25 fake registrations in a row", 429 not in codes, f"statuses: {sorted(set(codes))}")
cache.clear()
Car.objects.filter(pk=cid).update(phone="+7 777 123 45 67")
codes=[APIClient().get(f"/api/cars-cbv/{cid}/phone/").status_code for i in range(60)]
show("scraping phone numbers 60x", 429 not in codes, f"statuses: {sorted(set(codes))}")
cache.clear()
spoof=[APIClient(HTTP_X_FORWARDED_FOR=f"10.0.0.{i}").post("/api/login/",{"username":"bob","password":"x"},format="json").status_code for i in range(25)]
show("throttle bypass with fake X-Forwarded-For", 429 not in spoof)

print("== 5. PASSWORD POLICY")
for pw in ("12345678","password","qwertyui","bob12345"):
    c=APIClient().post("/api/register/",{"username":f"weak{pw[:4]}","email":f"{pw[:4]}@w.kz","password":pw},format="json").status_code
    show(f"weak password {pw!r} accepted", c==201)

print("== 6. INJECTION / XSS")
for payload in ("' OR 1=1 --","\"; DROP TABLE api_car; --","<script>alert(1)</script>"):
    s=[cl().get("/api/search/",{"q":payload}).status_code, cl(boss).get("/api/manage/cars/",{"q":payload}).status_code]
    show(f"search/filter with {payload!r}", any(x>=500 for x in s), f"statuses {s}")
show("database damaged by the attacks", Car.objects.count()==0)
x=cl(alice).post("/api/cars-cbv/",{**base,"title":"<img src=x onerror=alert(1)>"},format="json")
print("  [info] HTML in ad title is stored as plain text (%s); Angular escapes it when displaying" % x.status_code)
show("<script> in username accepted", APIClient().post("/api/register/",{"username":"<script>x</script>","email":"x@x.kz","password":STRONG},format="json").status_code==201)
for bad in ("ftp://example.com/a.jpg","javascript:alert(1)","file:///etc/passwd","data:text/html,<script>1</script>"):
    s=cl(alice).post("/api/cars-cbv/",{**base,"image_url":bad},format="json").status_code
    show(f"image link {bad[:22]!r} accepted", s==201)
s=cl(alice).post("/api/cars-cbv/",{**base,"extra_images":["ftp://example.com/a.jpg"]},format="json").status_code
show("extra photo with ftp:// accepted", s==201)
cache.clear()
good_login=APIClient().post("/api/login/",{"username":"alice","password":STRONG},format="json").status_code
print("  [info] normal login still works:",good_login,"| strong password registers:",APIClient().post("/api/register/",{"username":"newguy","email":"n@n.kz","password":STRONG},format="json").status_code)

print("== 7. INFORMATION LEAKS")
res=cl().get("/api/cars-cbv/")
show("owner email / phone in public car list", "email" in res.content.decode() or '"phone"' in res.content.decode())
nf=cl().get("/api/nothing-here/")
if settings.DEBUG:
    print("  skip  debug pages (404 with settings, browsable API): they exist only on your laptop.")
    print("        To check the hosting mode run:  DJANGO_ENV=production DJANGO_SECRET_KEY=x DJANGO_ALLOWED_HOSTS=testserver DJANGO_SSL_REDIRECT=0 python security_check.py")
else:
    show("404 page shows the URL list / settings (DEBUG pages)", b"URLconf" in nf.content or b"DEBUG" in nf.content)
    browse=cl().get("/api/cars-cbv/",HTTP_ACCEPT="text/html")
    show("browsable API web page is open to everybody", b"<html" in browse.content[:200].lower() or "text/html" in browse.headers.get("Content-Type",""))
h=cl().get("/api/cars-cbv/")
print("  headers:", {k:h.headers.get(k) for k in ("X-Content-Type-Options","X-Frame-Options","Referrer-Policy","Cross-Origin-Opener-Policy")})
cors=APIClient().get("/api/cars-cbv/",HTTP_ORIGIN="https://evil.example")
show("CORS: any website may read the API", cors.headers.get("Access-Control-Allow-Origin") in ("*","https://evil.example"), f"Allow-Origin={cors.headers.get('Access-Control-Allow-Origin')}")
r.teardown_databases(old)
print()
print(f"RESULT: {len(PASSED)} attacks blocked, {len(FAILED)} worked.")
sys.exit(1 if FAILED else 0)
