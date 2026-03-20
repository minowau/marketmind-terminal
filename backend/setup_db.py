import psycopg2

try:
    conn = psycopg2.connect(host="localhost", port=5432, user="mmuser", password="mmsecret", dbname="postgres")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname='marketmind'")
    exists = cur.fetchone()
    if exists:
        print("Database 'marketmind' already exists")
    else:
        cur.execute("CREATE DATABASE marketmind OWNER mmuser")
        print("Database 'marketmind' created successfully")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    print("Trying to connect as postgres superuser...")
    try:
        conn = psycopg2.connect(host="localhost", port=5432, user="postgres", password="postgres", dbname="postgres")
        conn.autocommit = True
        cur = conn.cursor()
        # Create user if not exists
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname='mmuser'")
        if not cur.fetchone():
            cur.execute("CREATE ROLE mmuser WITH LOGIN PASSWORD 'mmsecret'")
            print("Created role 'mmuser'")
        # Create database if not exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname='marketmind'")
        if not cur.fetchone():
            cur.execute("CREATE DATABASE marketmind OWNER mmuser")
            print("Database 'marketmind' created successfully")
        else:
            print("Database 'marketmind' already exists")
        cur.close()
        conn.close()
    except Exception as e2:
        print(f"Error with postgres user too: {e2}")
