# Система управления библиотекой

## Автор: Гимпель Кирилл 253505

## Функциональные требования к проекту

1. Регистрация и авторизация пользователей.
2. Управление профилями пользователей: добавление, удаление, изменение данных читателей и библиотекарей.
3. Система ролей: два уровня доступа — библиотекарь и пользователь (читатель).
4. CRUD-операции для книг: создание, чтение, обновление, удаление книг.
5. Поиск и фильтрация книг по автору, названию и жанру.
6. Бронирование книг.
7. Журналирование действий: отслеживание истории действий, таких как выдача и возврат книг.

## Инфологическая модель БД

<img src="./img/info_model.svg" alt="Картинка с инфологической моделью БД" width="700">

## Описание каждой сущности

<table>
    <thead>
        <tr>
            <th>Сущность</th>
            <th>Поле</th>
            <th>Тип данных</th>
            <th>Ограничения</th>
            <th>Связи</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="5"><b>User</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="5">Связь с Role (MTM), Loan (OTM), ActivityLog (OTM), Notification(OTM), Reservation(OTM)</td>
        </tr>
        <tr>
            <td>name</td>
            <td>VARCHAR(30)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>email</td>
            <td>VARCHAR(50)</td>
            <td>UNIQUE, NOT NULL</td>
        </tr>
        <tr>
            <td>password</td>
            <td>VARCHAR(20)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>created_at</td>
            <td>TIMESTAMP</td>
            <td>DEFAULT CURRENT_TIMESTAMP</td>
        </tr>
        <tr>
            <td rowspan="2"><b>Role</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="2">Связь с User (OTM)</td>
        </tr>
        <tr>
            <td>name</td>
            <td>VARCHAR(30)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td rowspan="5"><b>Book</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="5">Связь с Genre (MTM), Loan (OTM), Reservation (OTM), Author (MTM)</td>
        </tr>
        <tr>
            <td>title</td>
            <td>VARCHAR(100)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>summary</td>
            <td>TEXT</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>page_count</td>
            <td>INT</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>cover_image_url</td>
            <td>VARCHAR(255)</td>
            <td></td>
        </tr>
        <tr>
            <td rowspan="2"><b>Author</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="2">Связь с Book (MTM)</td>
        </tr>
        <tr>
            <td>name</td>
            <td>VARCHAR(100)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td rowspan="2"><b>Genre</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="2">Связь с Book (MTM)</td>
        </tr>
        <tr>
            <td>name</td>
            <td>VARCHAR(50)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td rowspan="5"><b>Loan</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="5">Связь с User (OTM), Book (OTM)</td>
        </tr>
        <tr>
            <td>user_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES User(id)</td>
        </tr>
        <tr>
            <td>book_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES Book(id)</td>
        </tr>
        <tr>
            <td>loan_date</td>
            <td>DATE</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>return_date</td>
            <td>DATE</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td rowspan="4"><b>Reservation</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="4">Связь с User (OTM), Book (OTM)</td>
        </tr>
        <tr>
            <td>user_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES User(id)</td>
        </tr>
        <tr>
            <td>book_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES Book(id)</td>
        </tr>
        <tr>
            <td>reserved_until</td>
            <td>DATE</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td rowspan="4"><b>ActivityLog</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="4">Связь с User (OTM)</td>
        </tr>
        <tr>
            <td>user_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES User(id)</td>
        </tr>
        <tr>
            <td>action</td>
            <td>VARCHAR(100)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>action_time</td>
            <td>TIMESTAMP</td>
            <td>DEFAULT CURRENT_TIMESTAMP</td>
        </tr>
        <tr>
            <td rowspan="6"><b>BookSuggestion</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="6">Связь с User (OTM)</td>
        </tr>
        <tr>
            <td>user_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES User(id)</td>
        </tr>
        <tr>
            <td>title</td>
            <td>VARCHAR(100)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>author</td>
            <td>VARCHAR(100)</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>status</td>
            <td>ENUM('pending', 'approved', 'rejected')</td>
            <td>DEFAULT 'pending'</td>
        </tr>
        <tr>
            <td>suggestion_date</td>
            <td>DATE</td>
            <td>DEFAULT CURRENT_DATE</td>
        </tr>
        <tr>
            <td rowspan="6"><b>Reviews</b></td>
            <td>id</td>
            <td>INT</td>
            <td>PRIMARY KEY</td>
            <td rowspan="6">Связь с User (OTM), Book (OTM)</td>
        </tr>
        <tr>
            <td>user_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES User(id)</td>
        </tr>
        <tr>
            <td>book_id</td>
            <td>INT</td>
            <td>FOREIGN KEY REFERENCES Book(id)</td>
        </tr>
        <tr>
            <td>rating</td>
            <td>TINYINT</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>comment</td>
            <td>TEXT</td>
            <td>NOT NULL</td>
        </tr>
        <tr>
            <td>review_date</td>
            <td>DATE</td>
            <td>DEFAULT CURRENT_DATE</td>
        </tr>
    </tbody>
</table>
