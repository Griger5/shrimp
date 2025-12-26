<script setup lang="ts">
const { fetch: refreshSession } = useUserSession();

const credentials = reactive({
	username: "",
	email: "",
	password: "",
});

async function register() {
	const { data, error } = await useFetch("/api/register", {
		method: "POST",
		body: credentials,
	});

	if (error.value?.statusCode) {
		if ([400, 409].includes(error.value.statusCode)) {
			alert(error.value.statusMessage);
		}
		else {
			alert("An account could not be created. Please try again later.");
		}

		return;
	}

	await refreshSession();
	await navigateTo("/");
}
</script>

<template>
	<h1>Register</h1>
	<form @submit.prevent="register">
		<input
			v-model="credentials.username"
			type="text"
			placeholder="Username"
		>
		<input
			v-model="credentials.email"
			type="email"
			placeholder="Email"
		>
		<input
			v-model="credentials.password"
			type="password"
			placeholder="Password"
		>
		<button type="submit">
			Register
		</button>
	</form>
</template>
