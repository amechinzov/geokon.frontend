# field-group

```
"field": {
    "class": "is-radio layout-tabs",
    "label": "Категории",
    "fields": [
        {
            "checkbox": true,
            "radio": true,
            "checked": true,
            "id": "checkbox-1",
            "name": "checkbox-1",
            "text": "Все"
        },
        {
            "checkbox": true,
            "radio": true,
            "id": "checkbox-2",
            "name": "checkbox-2",
            "text": "Социальная ответственность"
        }
    ],
    "hiddenFields": [
        {
            "checkbox": true,
            "id": "checkbox-8",
            "name": "group-1",
            "text": "Концентраторы"
        },
        {
            "checkbox": true,
            "id": "checkbox-9",
            "name": "group-1",
            "text": "Станции кислородные"
        }
    ],
    "toggle": {
        "text": "Открыть все"
    },
    "button": {
        "text": "Все"
    }
    "hint": {
        "mark": {
            "text": "?"
        },
        "tooltip": {
            "content": "Полное наименование мед. органи&shy;зации, в&nbsp;отношении которого реали&shy;зуется мероприятие, в&nbsp;соответствии со&nbsp;сведениями ЕГРЮЛ, код мед. организации (присвоенный в&nbsp;соот&shy;ветствии с&nbsp;Правилами ОМС)",
            "placement": "bottom-start"
        }
    },
    
}
```

- class - класс
- label - заголовок
- fields - поля
- hiddenFields - скрытые поля, раскрываются по кнопке toggle
- toggle - кнопка для показа скрытых полей
- button - кнопка для моб (поля в дропдауне)
- hint - подсказка 

````
"class": "is-radio", - для радиокнопок, меняется расположение
"class": "layout-tabs", - радиокнопки без иконки, меняются отступы 
````
