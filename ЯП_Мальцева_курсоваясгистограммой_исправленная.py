import matplotlib.pyplot as plt

def main():
    print("=" * 50)
    print("РАСЧЁТ СТОИМОСТИ ТУРИСТИЧЕСКОГО МАРШРУТА")
    print("=" * 50)
    
    # Основные параметры
    distance = float(input("\nРасстояние (км): "))
    people = int(input("Количество участников: "))
    
    # Выбор транспорта
    print("\nТРАНСПОРТ (с примерными ценами):")
    print("1 - Автомобиль (расход 10л/100км, бензин 85 р/л, дороги+парковки 2000р)")
    print("2 - Автобус (тариф 30р/км, оплата водителя 400р/ч)")
    print("3 - Поезд (плацкарт 2.3р/км, купе 3.8р/км, СВ 6.5р/км)")
    print("4 - Самолёт (тариф 5.2р/км + сборы 800р, багаж+трансфер 1500р)")
    transport = int(input("Ваш выбор (1-4): "))
    
    # Сезон и тип поездки
    season = int(input("Сезон (1-низкий, 2-высокий, пример: +40%): "))

    if season == 2:
        season_coef = 1.4
        season_coef_train = 1.2
    else:
        season_coef = 1.0
        season_coef_train = 1.0
    
    trip_type = int(input("Поездка (1-в одну сторону, 2-туда и обратно): "))
    if trip_type == 2:
        multiplier = 2
    else:
        multiplier = 1

    # Расчёт транспорта с примерными ценами
    if transport == 1:  # Автомобиль
        consumption = input("Расход (л/100км) [10]: ")
        if consumption:
            consumption = float(consumption)
        else:
            consumption = 10.0
        
        fuel_price = input("Цена топлива (руб) [85]: ")
        if fuel_price:
            fuel_price = float(fuel_price)
        else:
            fuel_price = 85.0
        
        fuel = (distance / 100) * consumption * fuel_price
        
        extra = input("Платные дороги+парковки (руб) [2000]: ")
        if extra:
            extra = float(extra)
        else:
            extra = 2000.0
        
        transport_cost = (fuel + extra) * multiplier
        transport_name = "Автомобиль"
        
    elif transport == 2:  # Автобус
        km_tariff = input("Тариф за км (руб) [30]: ")
        if km_tariff:
            km_tariff = float(km_tariff)
        else:
            km_tariff = 30.0
        km_cost = distance * km_tariff * multiplier
        
        hours = input("Время в пути (ч) [8]: ")
        if hours:
            hours = float(hours)
        else:
            hours = 8.0
        
        driver_pay = input("Оплата водителя (руб/ч) [400]: ")
        if driver_pay:
            driver_pay = float(driver_pay)
        else:
            driver_pay = 400.0
        hour_cost = hours * driver_pay * multiplier
        
        transport_cost = (km_cost + hour_cost) * season_coef
        transport_name = "Автобус"
        
    elif transport == 3:  # Поезд
        print("Тип: 1-плацкарт(2.3р/км), 2-купе(3.8р/км), 3-СВ(6.5р/км)")
        carriage = input("Выбор (1-3) [1]: ")
        if carriage:
            carriage = int(carriage)
        else:
            carriage = 1
        
        tariffs = [2.3, 3.8, 6.5]
        tariff = tariffs[carriage - 1]
        
        tickets = tariff * distance * season_coef_train * people * multiplier
        
        transfer = input("Трансфер до вокзала (руб) [500]: ")
        if transfer:
            transfer = float(transfer)
        else:
            transfer = 500.0
        
        transport_cost = tickets + transfer
        transport_name = "Поезд"
        
    else:  # Самолёт
        tickets = (5.2 * distance + 800) * season_coef * people * multiplier
        
        extra = input("Багаж+трансфер (руб) [1500]: ")
        if extra:
            extra = float(extra)
        else:
            extra = 1500.0
        
        transport_cost = tickets + extra
        transport_name = "Самолёт"
    
    # Экскурсии с примерными ценами
    excursions_cost = 0
    excursions_count = 0
    print("\nЭКСКУРСИИ (примерные цены: музей 500р, зоопарк 700р, природа 400р, памятник 300р)")
    print("0 - закончить добавление")
    
    while True:
        print("\n1-музей [500р], 2-зоопарк [700р], 3-природа [400р], 4-памятник [300р], 0-стоп")
        choice = input("Выбор: ")
        if choice == '' or choice == '0':
            break
        
        choice = int(choice)
        if choice == 1:
            price = input("Стоимость (руб/чел) [500]: ")
            if price:
                price = float(price)
            else:
                price = 500.0
        elif choice == 2:
            price = input("Стоимость (руб/чел) [700]: ")
            if price:
                price = float(price)
            else:
                price = 700.0
        elif choice == 3:
            price = input("Стоимость (руб/чел) [400]: ")
            if price:
                price = float(price)
            else:
                price = 400.0
        elif choice == 4:
            price = input("Стоимость (руб/чел) [300]: ")
            if price:
                price = float(price)
            else:
                price = 300.0
        else:
            print("Неверный выбор!")
            continue
        
        excursions_cost += price * people
        excursions_count += 1
        print(f"  Добавлено! (всего экскурсий: {excursions_count})")
    
    # Проживание и питание с примерными ценами
    print("\nПРОЧИЕ РАСХОДЫ:")
    hotels = input("Проживание на всех (руб/сутки) [3000]: ")
    if hotels:
        hotels = float(hotels)
    else:
        hotels = 3000.0
    
    food = input("Питание на всех (руб/сутки) [2000]: ")
    if food:
        food = float(food)
    else:
        food = 2000.0
    
    days = input("Количество дней поездки [1]: ")
    if days:
        days = int(days)
    else:
        days = 1
    
    # Итог
    total = transport_cost + excursions_cost + (hotels + food) * days
    
    print("\n" + "=" * 50)
    print("ИТОГОВЫЙ РАСЧЁТ:")
    print("=" * 50)
    print(f"Транспорт ({transport_name}):     {transport_cost:,.2f} руб.")
    if excursions_count > 0:
        print(f"Экскурсии ({excursions_count} шт):      {excursions_cost:,.2f} руб.")
    print(f"Проживание+питание ({days} дн):   {(hotels + food) * days:,.2f} руб.")
    print("-" * 50)
    print(f"ИТОГО:                           {total:,.2f} руб.")
    print(f"На 1 человека:                   {total / people:,.2f} руб.")
    print("=" * 50)
    
    # Краткая сводка по средним ценам
    print("\n ИСПОЛЬЗОВАННЫЕ СРЕДНИЕ ЦЕНЫ:")
    if transport == 1:
        print("  • Бензин: 85 руб/л")
        print("  • Расход: 10 л/100км")
        print("  • Платные дороги + парковки: 2000 руб")
    elif transport == 2:
        print("  • Тариф автобуса: 30 руб/км")
        print("  • Оплата водителя: 400 руб/час")
    elif transport == 3:
        print(f"  • Ж/Д тариф: {tariff} руб/км ({['плацкарт','купе','СВ'][carriage-1]})")
        print( "  • Трансфер до вокзала: 500 руб")
    else:
        print("  • Авиа тариф: 5.2 руб/км + сборы 800 руб")
        print("  • Багаж + трансфер: 1500 руб")
    print("  • Экскурсии: от 500 до 700 руб/чел")
    print("  • Проживание: 3000 руб/сутки на всех")
    print("  • Питание: 2000 руб/сутки на всех")
    
    # ГИСТОГРАММА
    categories = ['Транспорт', 'Экскурсии', 'Проживание+питание']
    values = [transport_cost, excursions_cost, (hotels + food) * days]
    colors = ['blue', 'green', 'red']
    
    plt.figure(figsize=(8, 5))
    plt.bar(categories, values, color=colors)
    plt.title('Структура затрат на маршрут')
    plt.ylabel('Стоимость (руб.)')
    
    for i, v in enumerate(values):
        plt.text(i, v + 1000, f'{v:,.0f} руб.', ha='center')
    
    plt.grid(axis='y', alpha=0.3)
    plt.show()
        
if __name__ == "__main__":
    main()
