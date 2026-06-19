# PostgreSQL Setup for DevDocs AI Guide

This guide will walk you through installing and configuring PostgreSQL on Windows so you can run the DevDocs AI Guide web application.

## 1. Download PostgreSQL

We recommend the EDB installer, which simplifies the setup process.

1.  Go to the [PostgreSQL download page](https://www.postgresql.org/download/windows/).
2.  Click the link for the **EDB installer**.
3.  On the EDB page, select the latest version of PostgreSQL for your Windows system (e.g., 16.x for Windows x86-64).
4.  Download the installer.

## 2. Install PostgreSQL

1.  Run the downloaded installer.
2.  You can accept the default settings for most of the installation wizard steps.
3.  **Crucially, when you get to the "Password" step, you must set a password for the `postgres` superuser.** Remember this password. You will need it to connect to the database and to configure the application.
4.  For the "Port", the default is `5432`. You can leave this as is unless you have another service using that port.
5.  Complete the installation. You can uncheck the option to install additional tools like Stack Builder at the end.

## 3. Create the Database

After installation, you need to create the database that the guide app will use. You can do this using `psql` (the command-line tool) or pgAdmin (a graphical tool).

### Using psql (Command Line)

1.  Open your command prompt or PowerShell.
2.  Navigate to the PostgreSQL `bin` directory. This is typically something like `C:\Program Files\PostgreSQL\16\bin`.
3.  Connect to the default `postgres` database as the superuser:
    ```bash
    psql -U postgres
    ```
4.  It will prompt you for the password you set during installation.
5.  Once connected, run the following SQL command to create the database:
    ```sql
    CREATE DATABASE devdocs_guide;
    ```
6.  You can verify it was created by listing all databases:
    ```sql
    \l
    ```
7.  Type `\q` to exit psql.

### Using pgAdmin (Graphical Interface)

1.  Find and open pgAdmin from your Start Menu.
2.  It will ask for the master password you set during installation to unlock the tool.
3.  In the left-hand browser panel, right-click on **Servers** -> **Create** -> **Server...**.
4.  Give it a name (e.g., "Local PostgreSQL").
5.  Go to the **Connection** tab and ensure the host is `localhost` and the user is `postgres`. Enter your password.
6.  Once connected, right-click on **Databases** -> **Create** -> **Database...**.
7.  Enter `devdocs_guide` as the database name and click **Save**.

## 4. Configure the Application

1.  In the root of the `devdocs-ai-guide` project, create a new file named `.env`.
2.  Copy the contents of `.env.example` into your new `.env` file.
3.  Edit the `.env` file and replace `your_password_here` with the actual password you set for the `postgres` user.

    ```
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=devdocs_guide
    DB_PASSWORD=your_actual_password
    DB_PORT=5432
    ```

## 5. Verify the Connection

Once you've completed the steps above, you can start the application.

```bash
npm run dev
```

If the connection is successful, the web app will load at `http://localhost:5173` (or whatever port Vite chooses).

## Common Troubleshooting

*   **"password authentication failed for user 'postgres'"**: Your password in the `.env` file is incorrect.
*   **"connection refused"**: The PostgreSQL service isn't running. Search for "Services" in the Windows Start Menu, find the service named `postgresql-x64-16` (or similar), and make sure its status is "Running".
*   **"port 5432 is already in use"**: Another application is using the default PostgreSQL port. You'll need to either stop that application or change the port in both your PostgreSQL configuration and the `.env` file.
*   **"database 'devdocs_guide' does not exist"**: You may have skipped Step 3. Make sure you have created the database.
