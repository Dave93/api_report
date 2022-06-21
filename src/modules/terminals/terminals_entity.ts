export interface Terminal {
    name:          string;
    name_uz:       string;
    desc:          string;
    desc_uz:       string;
    terminal_id:   string;
    active:        boolean;
    delivery_time: null;
    pickup_time:   null;
    delivery_type: string;
    city_id:       number;
    open_work:     Date;
    close_work:    Date;
    open_weekend:  Date;
    close_weekend: Date;
    payme_active:  boolean;
    click_active:  boolean;
    location:      Location;
    latitude:      string;
    longitude:     string;
}

export interface Location {
    lat: string;
    lon: string;
}
