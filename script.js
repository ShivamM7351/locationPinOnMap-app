'use strict';


// const form = document.querySelector(".form");
// const containerWorkouts = document.querySelector(".workouts");
// const inputType = document.querySelector(".form__input--type");
// const inputDistance = document.querySelector(".form__input--distance");
// const inputDuration = document.querySelector(".form__input--duration");
// const inputCadence = document.querySelector(".form__input--cadence");
// const inputElevation = document.querySelector(".form__input--elevation");
// const btnReset = document.querySelector(".btn--clear-all");

let map, mapEvent;

class workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        this.distance = distance;// in km
        this.duration = duration;// in min
        this.coords = coords;// also define in array
        // this._setDescription();
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'September', 'October', 'November', 'December'];

         this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
            months[this.date.getMonth()]} 
            ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    }
};

class Running extends workout{
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}


class Cycling extends workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// const running1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(running1, cycling1)

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const btnReset = document.querySelector(".btn--clear-all");


class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];

    constructor() {
        // Get user location
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        // Add event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
        btnReset.addEventListener('click', this.reset);
    }


    _getPosition() {
        // GEOLOCATION API
        if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
    alert('Could not get your position');
});
 };



    _loadMap(position) {
            // console.log(position)
            // this are the coordinates of our current location
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    
            // Here L is a main function that Leaflet gives us as an entry point
            const coords = [latitude, longitude];
            // Set view second parameter is use for set the value of zoomed out or zoomed close
            // console.log(this);
            this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
            // console.log(map);
            // tile layer gives the map view like a tiles.
            // we can change the map view using fr/hot at the place
            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
    
            // work as a add event listener on map in Leaflet library
            this.#map.on('click', this._showForm.bind(this));

            this.#workouts.forEach(work =>{
                this._renderWorkoutMarker(work);
            })

        };



    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    };


    _newWorkout(event) {

        const validInputs = (...inputs) => inputs.every((inp) => Number.isFinite(inp));

        const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

        event.preventDefault();

        // GET DATA FROM FORM
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //IF WORKOUT RUNNING, CREATE RUNNING OBJECT
        if(type === 'running'){
            //CHECK IF DATA IS VALID
            const cadence = +inputCadence.value;

            if(!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
              return alert('Inputs have to be positive numbers!');

              workout = new Running([lat, lng], distance, duration, cadence);
    
        }



        //IF WORKOUT CYCLING, CREATE CYCLING OBJECT
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            if(!validInputs(distance, duration, elevation) || !allPositive(distance, duration))
            return alert('Inputs have to be positive numbers!');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }


        //ADD NEW OBJECT TO WORKOUT ARRAY
        this.#workouts.push(workout);
        // console.log(workout);

        //RENDER WORKOUT ON MAP AS MARKER
        // const { lat, lng } = this.#mapEvent.latlng;
        this._renderWorkoutMarker(workout);

        //RENDER WORKOUT ON LIST
        this._renderWorkout(workout);

        // HIDE THE FORM AND Clear Input fields
         this._hideForm();

         // Set local storage to all workouts
         this._setLocalStorage();
          
    };

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
    })
    )
    .setPopupContent(`${workout.type === 'running'?'🚶‍♂️':'🚴‍♂️'} ${workout.description}`)
    .openPopup();
    }

    _renderWorkout(workout) {

        let html = `
        <li class = "workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class = "workout__title">${workout.description}</h2>
        <div class = "workout__details">
        <span class = "workout__icon">${workout.type === 'running'?'🚶‍♂️':'🚴‍♂️'}</span>
        <span class = "workout__value">${workout.distance}</span>
        <span class = "workout__unit">km</span>
        </div>
        <div class = "workout__details">
        <span class = "workout__icon">⏱️</span>
        <span class = "workout__value">${workout.duration}</span>
        <span class = "workout__unit">min</span>
        </div>`;

        if(workout.type === 'running')
        html += `
        <div class = "workout__details">
        <span class = "workout__icon">⚡</span>
        <span class = "workout__value">${workout.pace.toFixed(1)}</span>
        <span class = "workout__unit">km</span>
        </div>

        <div class = "workout__details">
        <span class = "workout__icon">🦶</span>
        <span class = "workout__value">${workout.cadence}</span>
        <span class = "workout__unit">km</span>
        </div>`;

        if(workout.type === 'cycling')
        html += `
        <div class = "workout__details">
        <span class = "workout__icon">⚡</span>
        <span class = "workout__value">${workout.speed.toFixed(1)}</span>
        <span class = "workout__unit">km</span>
        </div>

       <div class = "workout__details">
        <span class = "workout__icon">🗻</span>
        <span class = "workout__value">${workout.elevationGain}</span>
        <span class = "workout__unit">km</span>
        </div>
        </li>`

        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl);

        if(!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        // console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        })

        //Using the public interface
        // workout.click();
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))
        // console.log(data)

        if(!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work =>{
            this._renderWorkout(work)
        })
    }

    reset() {
        localStorage.removeItem('workouts')
        location.reload()
    }
}


const app = new App();
