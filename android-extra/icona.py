# Copia le icone dell'app nel progetto Android e toglie le icone adattive di Capacitor
import os, shutil, sys
res = sys.argv[1]
qui = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'res')
for d in os.listdir(qui):
    for f in os.listdir(os.path.join(qui, d)):
        os.makedirs(os.path.join(res, d), exist_ok=True)
        shutil.copy(os.path.join(qui, d, f), os.path.join(res, d, f))
shutil.rmtree(os.path.join(res, 'mipmap-anydpi-v26'), ignore_errors=True)
print('icone copiate')
