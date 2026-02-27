#!/usr/bin/env python3
import random
import string
import sys

def generar_contrasena(longitud=None):
    """
    Genera una contraseña aleatoria de 8 a 12 caracteres
    con números, letras y caracteres especiales
    """
    if longitud is None:
        longitud = random.randint(8, 12)
    
    caracteres_especiales = "!@#$%&*"
    todos_caracteres = string.ascii_letters + string.digits + caracteres_especiales
    
    # Asegurar al menos un carácter de cada tipo
    contrasena = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
        random.choice(caracteres_especiales)
    ]
    
    # Completar el resto de la longitud
    contrasena += random.choices(todos_caracteres, k=longitud - 4)
    
    # Mezclar aleatoriamente
    random.shuffle(contrasena)
    
    return ''.join(contrasena)

def generar_codigo_2fa(longitud=None):
    """
    Genera un código de doble factor de 6 a 8 caracteres
    con números y letras mayúsculas
    """
    if longitud is None:
        longitud = random.randint(6, 8)
    
    caracteres = string.ascii_uppercase + string.digits
    codigo = ''.join(random.choices(caracteres, k=longitud))
    
    return codigo

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python password_generator.py [password|2fa] [longitud_opcional]")
        sys.exit(1)
    
    tipo = sys.argv[1].lower()
    longitud = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    if tipo == "password":
        resultado = generar_contrasena(longitud)
    elif tipo == "2fa":
        resultado = generar_codigo_2fa(longitud)
    else:
        print("Tipo inválido. Use 'password' o '2fa'")
        sys.exit(1)
    
    print(resultado)
